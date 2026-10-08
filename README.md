# Biblioteca «Francisco Rolando Velázquez González»: autoservicio y kioscos

Complemento digital de la biblioteca de la Facultad de Ciencias Jurídicas y Sociales (USAC), según la propuesta
«Del anaquel cerrado al acceso inteligente»:

- **Catálogo (OPAC)** de tesis, con ficha, documento digital (acceso y descarga, solo consulta o sin acceso) y código QR.
- **Reserva de espacios de estudio** (cubículos, estaciones y sala de lectura), con plano de la sala.
- **Solicitud de solvencia**.
- **Comprobantes** en pantalla, impresos (ticket de 80 mm) y por correo.
- **Kioscos táctiles** con cierre de sesión por inactividad y candado de pantalla.
- **Panel del personal** con cuatro roles y estadísticas de uso (`/admin`).

```
backend/    API en Express (datos en archivos JSON dentro de backend/data)
frontend/   Sitio y panel en React + Vite + Tailwind
```

## Para trabajar en tu equipo

Hace falta Node 20.12 o más nuevo.

```bash
cd backend  && npm install && cp .env.example .env   # en Windows: copy .env.example .env  (escribe tus claves en .env)
cd frontend && npm install
```

En dos terminales:

```bash
cd backend  && npm run dev     # API en http://localhost:4001
cd frontend && npm run dev     # sitio en http://localhost:5174 (reenvía /api al backend)
```

El panel está en `http://localhost:5174/admin`. Sus cuatro cuentas iniciales (`admin`, `circulacion`, `tesis` y `consulta`)
toman la clave de `CLAVE_ADMIN`, `CLAVE_CIRCULACION`, `CLAVE_TESIS` y `CLAVE_CONSULTA` en `backend/.env`. Si alguna queda
vacía, el servidor genera una clave temporal y la muestra en su consola. **`backend/.env` no se sube a git.** Las demás cuentas
se crean desde el panel («Cuentas del personal»).

## Para publicarlo

1. Compila el sitio: `cd frontend && npm install && npm run build` (genera `frontend/dist`).
2. En el servidor: `cd backend && npm install --omit=dev`, copia `.env.example` como `.env`, completa las claves y agrega
   `NODE_ENV=production`. Con eso el mismo servidor entrega el sitio compilado y la API: `node server.js` (o un servicio que lo
   mantenga encendido, como pm2 o systemd).
3. Detrás de nginx u otro proxy con HTTPS, define `TRUST_PROXY=1` para que los límites de uso y el candado de los kioscos vean la
   dirección real de cada equipo.
4. **Respalda `backend/data`** (o la carpeta de `DATA_DIR`): ahí están las reservas, solicitudes, cuentas, catálogo, horarios y
   actividad. Las sesiones del panel viven en memoria: al reiniciar el servidor el personal debe volver a entrar.
5. Correo: sin `SMTP_*` los comprobantes por correo no salen (quedan simulados). Con `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` y
   `SMTP_FROM` se envían de verdad.
6. Logo: el archivo es `frontend/public/logo-biblioteca.png` (y `icono-biblioteca.png` para la pestaña del navegador).

Todos los ajustes del servidor están explicados en `backend/.env.example`.

### Cargar el catálogo

En el panel, **Catálogo → Importar**: sube la hoja de cálculo del catálogo en CSV (hay una plantilla para descargar) o agrega
las tesis una por una. El código de cada tesis no se cambia después: está impreso en el QR de su etiqueta.

### Horarios de reserva

En el panel, **Horarios y cierres** (solo el administrador): las horas en que se aceptan reservas por día de la semana y los días
de cierre. Solo se ofrecen horas enteras que caben completas dentro de un tramo.

## Kioscos

Cada kiosco abre el sitio con su número: `https://tu-servidor/?kiosco=1`, `?kiosco=2`... Con eso el sitio:

- muestra una pantalla de bienvenida y pide la pantalla completa con el primer toque (y la vuelve a pedir si se sale de ella);
- cierra la sesión y borra lo escrito tras 90 segundos sin tocar la pantalla (con un aviso de 15 segundos), o si la pestaña
  queda oculta o pierde el foco;
- bloquea menú contextual, selección de texto, zoom, atajos de las herramientas del navegador, enlaces a otros sitios y ventanas
  nuevas, y no ofrece descargas;
- cuenta cada kiosco en las estadísticas;
- no puede abrir el panel del personal (`/admin`).

**Una página web no puede, por sí sola, impedir que alguien cambie de ventana o escriba otra dirección.** Para un candado
completo el equipo debe estar configurado como kiosco:

- **Navegador en modo kiosco.** En Chrome o Edge, por ejemplo:
  `chrome.exe --kiosk "https://tu-servidor/?kiosco=1" --incognito --noerrdialogs --disable-infobars --disable-pinch --overscroll-history-navigation=0 --kiosk-printing`
  (`--kiosk-printing` imprime el ticket en la impresora predeterminada sin pedir confirmación).
- **Sistema operativo.** En Windows, usa «acceso asignado» (modo kiosco de una sola aplicación) con una cuenta sin privilegios; en
  Linux, una sesión que arranque solo el navegador. Así no hay barra de tareas, ni Alt+Tab, ni escritorio.
- **Red.** Define `KIOSCOS_IP` en `backend/.env` con las direcciones fijas de los kioscos: el servidor les niega el panel del
  personal, su API y el inicio de sesión, aunque alguien escriba la dirección.
- **Salida del personal.** Para quitar el modo kiosco de una pestaña (mantenimiento), abre `/?kiosco=salir`. Cerrar el navegador
  del kiosco requiere el teclado del equipo.

## Roles del panel

| Rol | Qué puede hacer |
| --- | --- |
| Administrador | Todo: cuentas del personal, configuración (tolerancia y pausas), horarios y cierres, catálogo, actividad |
| Personal de circulación | Reservas, solicitudes de solvencia y usuarios |
| Personal de tesis | Catálogo, documentos digitales y códigos QR |
| Consulta | Solo estadísticas |

El servidor comprueba el rol en cada petición; ocultar una sección en el panel es solo comodidad.
