# Imagen para publicar el sitio y la API de la biblioteca en un solo contenedor.
#
#   docker build -t biblioteca-opac .
#   docker run -p 4001:4001 -v biblioteca-datos:/data --env-file backend/.env biblioteca-opac
#
# Los datos (reservas, solicitudes, cuentas, catálogo, horarios) quedan en /data: ahí hay que montar un volumen y
# respaldarlo. Las claves del panel y los demás ajustes se pasan como variables de entorno (ver backend/.env.example).

# 1) Compila el sitio (React + Vite).
FROM node:24-bookworm-slim AS sitio
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2) Instala solo las dependencias que necesita el servidor.
FROM node:24-bookworm-slim AS dependencias
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# 3) Imagen final: el servidor y el sitio ya compilado, con la misma disposición de carpetas que en el repositorio
#    (el servidor busca el sitio en ../frontend/dist).
FROM node:24-bookworm-slim
ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=4001
WORKDIR /app
COPY --from=dependencias /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=sitio /app/frontend/dist ./frontend/dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /data \
    && chown node:node /data
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "backend/server.js"]
