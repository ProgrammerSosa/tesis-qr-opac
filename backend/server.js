// La biblioteca trabaja en hora de Guatemala: los horarios, las reservas y la entrega de solvencias dependen de ella.
// Si el servidor donde se instale usa otra zona (casi todos usan UTC), así igual se calculan bien.
process.env.TZ = process.env.TZ || 'America/Guatemala';

const fs = require('node:fs');
const path = require('node:path');

// Los ajustes locales, como las claves del panel del personal, viven en backend/.env (no se sube a git; el modelo
// es backend/.env.example). Si el archivo no existe se usa el entorno tal cual, y lo que ya venga definido en el
// entorno tiene prioridad sobre el archivo. Debe cargarse antes que el resto del código, que lee esas variables.
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const express = require('express');
const cors = require('cors');

const catalogRoutes = require('./src/catalog/catalog_routes');
const reservasRoutes = require('./src/reservas/reservas_routes');
const solvenciaRoutes = require('./src/solvencia/solvencia_routes');
const tramitesRoutes = require('./src/tramites/tramites_routes');
const adminRoutes = require('./src/admin/admin_routes');
const eventosRoutes = require('./src/eventos/eventos_routes');
const authRoutes = require('./src/auth/auth_routes');
const comprobantesRoutes = require('./src/comprobantes/comprobantes_routes');
const portadaRoutes = require('./src/portada/portada_routes');
const { retirarClavesTemporales } = require('./src/auth/cuentas_data');
const { correoConfigurado } = require('./utils/correo');
const { limitar, soloEscrituras } = require('./utils/limitador');
const { fail } = require('./utils/httpResponse');

const app = express();
app.disable('x-powered-by');

// Detrás de un proxy (nginx, un servicio en la nube) hay que indicarlo para que los límites de uso cuenten a cada
// persona y no al proxy. TRUST_PROXY puede ser un número (cuántos proxys hay) o una dirección.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS: con CORS_ORIGIN (una o varias direcciones separadas por coma) solo esos sitios pueden usar la API desde un
// navegador. Si el frontend se sirve desde este mismo servidor no hace falta. Sin la variable se acepta cualquier origen,
// que es cómodo para desarrollar pero no para publicar.
const origenesPermitidos = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(origenesPermitidos.length > 0 ? { origin: origenesPermitidos } : undefined));

// La importación del catálogo trae miles de filas: es la única petición que puede ser grande.
app.use('/api/admin/catalogo/importar', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '100kb' }));

// Límites de uso: evitan que un programa llene la biblioteca de reservas o solicitudes falsas. Solo cuentan las
// peticiones que escriben datos; consultar es libre.
// Cada servicio lleva su propia cuenta. LIMITE_ESCRITURAS cambia cuántas se permiten por minuto (30 por defecto).
const porMinuto = Number(process.env.LIMITE_ESCRITURAS) || 30;
app.use('/api/auth/login', soloEscrituras(limitar({ ventanaMs: 5 * 60 * 1000, maximo: 30, mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos.' })));
app.use('/api/reservas', soloEscrituras(limitar({ maximo: porMinuto })));
app.use('/api/solvencia', soloEscrituras(limitar({ maximo: porMinuto })));
app.use('/api/tramites', soloEscrituras(limitar({ maximo: porMinuto })));
app.use('/api/comprobantes', soloEscrituras(limitar({ maximo: Math.max(Math.floor(porMinuto / 3), 1) }))); // cada una manda un correo
app.use('/api/eventos', soloEscrituras(limitar({ maximo: porMinuto * 4 })));

app.get('/health', (req, res) => res.json({ success: true, data: 'ok' }));

app.use('/api/tesis', catalogRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/solvencia', solvenciaRoutes);
app.use('/api/tramites', tramitesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/comprobantes', comprobantesRoutes);
app.use('/api', portadaRoutes);

app.use('/api', (req, res) => fail(res, 'Ruta no encontrada', 404));

// Para publicar, el mismo servidor entrega el sitio ya compilado (frontend/dist). Se activa con NODE_ENV=production
// o SERVE_FRONTEND=1, siempre que exista esa carpeta (se genera con "npm run build" dentro de frontend).
const carpetaDelSitio = path.join(__dirname, '..', 'frontend', 'dist');
if ((process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === '1') && fs.existsSync(carpetaDelSitio)) {
  app.use(
    express.static(carpetaDelSitio, {
      index: false,
      setHeaders: (res, archivo) => {
        // Los archivos de /assets llevan su huella en el nombre: pueden guardarse un año. El resto se revisa siempre.
        res.set('Cache-Control', archivo.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    })
  );
  // Cualquier otra dirección es una página del sitio: la resuelve el navegador (React Router).
  app.get(/^(?!\/health).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(carpetaDelSitio, 'index.html'));
  });
}

app.use((req, res) => fail(res, 'Ruta no encontrada', 404));

// Errores que no se previeron: el cuerpo mal formado o demasiado grande se explica; el resto se anota en la consola
// del servidor y a la persona solo se le dice que algo falló.
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return fail(res, 'El cuerpo de la petición no es JSON válido', 400);
  if (error.type === 'entity.too.large') return fail(res, 'La petición es demasiado grande', 413);
  console.error(error);
  return fail(res, 'Ocurrió un error en el servidor', 500);
});

// Una cuenta sin clave definida recibe una clave temporal; se muestra aquí, en la consola, y en ningún otro lado.
function avisarClavesTemporales() {
  const temporales = retirarClavesTemporales();
  if (temporales.length === 0) return;
  console.warn('\n[panel del personal] Hay cuentas sin clave definida: usan una clave temporal, válida hasta que se reinicie el servidor.');
  temporales.forEach(({ usuario, variable, clave }) => {
    console.warn(`  ${usuario.padEnd(12)} ${clave}   (para fijarla: ${variable} en backend/.env)`);
  });
  console.warn('  Copia backend/.env.example como backend/.env y escribe tus claves para que no cambien.\n');
}

function start() {
  const port = process.env.PORT || 4001;
  app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
    console.log(`  Zona horaria: ${process.env.TZ} · correo: ${correoConfigurado() ? 'SMTP configurado' : 'simulado (sin SMTP)'}`);
    avisarClavesTemporales();
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
