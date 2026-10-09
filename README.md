# Biblioteca «Francisco Rolando Velázquez González»: autoservicio y kioscos

Complemento digital de la biblioteca de la Facultad de Ciencias Jurídicas y Sociales (USAC), según la propuesta
«Del anaquel cerrado al acceso inteligente»:

- **Catálogo (OPAC)** de tesis, con ficha, documento digital (acceso y descarga, solo consulta o sin acceso) y código QR.
- **Reserva de espacios de estudio** (cubículos, estaciones y sala de lectura), con plano de la sala.
- **Solicitud de solvencia**.
- **Comprobantes** en pantalla, impresos (ticket de 80 mm) y por correo.
- **Kioscos táctiles** con cierre de sesión por inactividad y candado de pantalla.
- **Panel del personal** con cuatro roles y estadísticas de uso (`/privateAccess`).

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

El panel está en `http://localhost:5174/privateAccess`. Sus cuatro cuentas iniciales (`admin`, `circulacion`, `tesis` y `consulta`)
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
5. Correo: sin configurarlo, los comprobantes por correo no salen (quedan simulados); ver «Correo» más abajo.
6. Logo: el archivo es `frontend/public/logo-biblioteca.png` (y `icono-biblioteca.png` para la pestaña del navegador).

Todos los ajustes del servidor están explicados en `backend/.env.example`.

### Con Docker (Railway, Render, Fly.io o un servidor propio)

El `Dockerfile` de la raíz arma una sola imagen con el servidor y el sitio ya compilado:

```bash
docker build -t biblioteca-opac .
docker run -p 4001:4001 -v biblioteca-datos:/data --env-file backend/.env biblioteca-opac
```

Una plataforma que construye desde GitHub solo necesita apuntar a este repositorio: detecta el `Dockerfile` y usa el puerto de
la variable `PORT`.

- **Datos.** Reservas, solicitudes, cuentas, catálogo y horarios quedan en `/data` (`DATA_DIR`). Hay que montar ahí un volumen
  persistente y respaldarlo; sin volumen, cada despliegue empieza de cero. Al apagar el servidor (`SIGTERM`) se guarda lo pendiente.
- **Claves.** Define `CLAVE_ADMIN`, `CLAVE_CIRCULACION`, `CLAVE_TESIS` y `CLAVE_CONSULTA` como variables de la plataforma, nuevas y
  largas (no uses las de pruebas). Si falta alguna, el servidor inventa una temporal y la escribe en sus registros.
- **Proxy.** Detrás del proxy de la plataforma define `TRUST_PROXY=1`; si no, los límites de uso ven una sola «persona» (el
  proxy) y bloquean a todos a la vez.
- **Kioscos.** `KIOSCOS_IP` solo sirve si el servidor ve la dirección propia de cada kiosco (servidor dentro de la misma red). En
  la nube todos los equipos de la facultad salen con la misma dirección pública: déjalo vacío. El candado de pantalla del kiosco y
  el inicio de sesión del panel siguen protegiendo.
- **Una sola instancia.** Las sesiones del panel están en memoria y los datos son archivos: no se puede escalar a varias copias.
- **Primer arranque.** El catálogo trae siete tesis de ejemplo; en **Catálogo → Importar** se marca «Reemplazar todo el catálogo»
  para dejar solo el real.
- **Salud.** `/health` responde `ok` cuando el servidor está listo.

### Correo

Los comprobantes de reservas y de solicitudes de solvencia llegan por correo (con el comprobante en HTML y en texto). Hay tres modos y
el servidor elige según sus variables (modelo en `backend/.env.example`):

- **API de un servicio de correo** (`CORREO_API=brevo` o `resend`, con `CORREO_API_KEY`): la opción para la nube. Railway (planes
  Free, Trial y Hobby) y Render (servicios gratuitos) bloquean los puertos SMTP, y la API va por HTTPS.
- **SMTP** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`): Gmail, Microsoft 365 o el servidor de la universidad. Gmail y
  Microsoft 365 piden una «contraseña de aplicación».
- **Simulado** (sin nada configurado): los correos se arman pero no salen. La pantalla de comprobante lo explica a quien lo pide.

`CORREO_REMITENTE` es la dirección desde la que se envía (en la API debe estar verificada en el servicio). En el panel, **Correo**
(solo el administrador), se ve cómo quedó, se comprueba la conexión SMTP, se manda un correo de prueba y se ven los últimos
envíos con sus errores. Si el correo falla, la reserva o la solicitud siguen adelante: la persona tiene su comprobante en pantalla.

### Cargar el catálogo

En el panel, **Catálogo → Importar**: sube la hoja de cálculo del catálogo en CSV (hay una plantilla para descargar) o agrega
las tesis una por una. El código de cada tesis no se cambia después: está impreso en el QR de su etiqueta. Las columnas `url`
(la URL de la tesis) y `acceso` (descarga, consulta o sin acceso) son opcionales: con ellas cada tesis llega con su documento digital.

### Agregar una tesis y su código QR

En **Catálogo → Agregar tesis** se escriben los datos de la tesis y su **URL** (el enlace de su versión digital). Con esa URL el
sistema genera el código QR de la etiqueta: se ve al instante en el formulario, se puede descargar como imagen (PNG) y, al
guardar, imprimir la etiqueta de contraportada. El nivel de acceso (descarga, solo consulta o sin acceso) se elige en el mismo
formulario.

El código puede llevar a dos destinos:

- **Directo a la URL de la tesis** (lo que sale por defecto). Si la URL cambia, hay que reimprimir la etiqueta y no se cuentan los
  escaneos en las estadísticas.
- **A la ficha de la tesis en este sistema**: una dirección estable. Si el archivo cambia de lugar, el código ya impreso sigue
  sirviendo, se cuentan los escaneos y el sistema controla el acceso (propuesta, sección 4.3).

El destino se cambia tesis por tesis en **Códigos QR** («Que lleve a la ficha» / «Que lleve a la URL»). Si la tesis no tiene URL o
está «sin acceso digital», el código siempre lleva a la ficha. Un código con una URL muy larga sale muy denso: conviene una URL corta.

Mientras una tesis no tiene URL, su documento digital es un PDF de ejemplo que el sistema arma con los datos del catálogo: portada
con el logo, ficha, resumen con palabras clave, cómo citarla y condiciones de uso, con encabezado y número de página (y una marca de
agua «solo consulta» si ese es su nivel de acceso). Al escribir la URL, el documento y el QR pasan a ese archivo.

### Dirección y redes de la biblioteca

La dirección, el enlace «Cómo llegar» y las redes (Facebook, Instagram y YouTube) que se ven en la franja superior, en el inicio
(«Horarios y ubicación») y en el pie están en `frontend/src/shared/config/library.js`. En un kiosco no se muestran los enlaces a
otros sitios.

### Horarios de reserva

En el panel, **Horarios y cierres** (solo el administrador): las horas en que se aceptan reservas por día de la semana y los días
de cierre. Solo se ofrecen horas enteras que caben completas dentro de un tramo.

### Reservas por horas (todos los lugares de estudio)

Los cubículos, las estaciones y las sillas de la sala de lectura se reservan igual, por horas enteras: la persona toca el lugar en el
plano y escribe de qué hora a qué hora lo necesita (por ejemplo, de 10:00 a 13:00). Si ya está reservado en esas horas, la pantalla avisa
(«Este cubículo ya está reservado. Intenta con otro cubículo o cambia la hora»; lo mismo para estaciones y sillas) y no deja confirmar.
La reserva debe ser de horas seguidas dentro del horario del día: no cruza la pausa del mediodía. Una persona no puede tener dos
lugares reservados a la misma hora. En **Configuración** el administrador fija cuántas horas puede reservar una persona por vez y en
total al día entre todos los lugares (al empezar, 8 y 8).

## Kioscos

Cada kiosco abre el sitio con su número: `https://tu-servidor/?kiosco=1`, `?kiosco=2`... Con eso el sitio:

- muestra una pantalla de bienvenida y pide la pantalla completa con el primer toque (y la vuelve a pedir si se sale de ella);
- cierra la sesión y borra lo escrito tras 90 segundos sin tocar la pantalla (con un aviso de 15 segundos), o si la pestaña
  queda oculta o pierde el foco;
- bloquea menú contextual, selección de texto, zoom, atajos de las herramientas del navegador, enlaces a otros sitios y ventanas
  nuevas, y no ofrece descargas;
- cuenta cada kiosco en las estadísticas;
- no puede abrir el panel del personal (`/privateAccess`).

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
| Administrador | Todo: cuentas del personal, configuración (tolerancia, horas de las reservas y pausas), horarios y cierres, catálogo, actividad |
| Personal de circulación | Reservas, solicitudes de solvencia y usuarios |
| Personal de tesis | Catálogo, documentos digitales y códigos QR |
| Consulta | Solo estadísticas |

El servidor comprueba el rol en cada petición; ocultar una sección en el panel es solo comodidad.

### Protección de rutas

- **En el navegador**, una guardia corre antes de mostrar cualquier página de `/privateAccess/...`: sin sesión manda al inicio de sesión (y al
  entrar vuelve a la página que se quería ver), con una sesión que el servidor ya no reconoce la cierra y avisa, y con una sección que
  el rol no puede ver redirige al resumen con un aviso. Una pestaña de kiosco no entra al panel.
- **En el servidor**, toda ruta del personal exige una sesión y el rol correcto (401 sin sesión, 403 con otro rol); con `KIOSCOS_IP`
  los kioscos ni siquiera llegan al panel ni a su API. Las respuestas de la API del personal no se guardan en cachés y el panel no se
  indexa en buscadores (`X-Robots-Tag` y `robots.txt`).
- La dirección del panel se define en `frontend/src/shared/config/rutas.js` y en `backend/utils/rutas.js` (las dos deben coincidir, y
  hay que volver a compilar el sitio). `/admin` ya no existe. Un nombre poco evidente evita visitas por costumbre, pero lo que protege
  el panel es el inicio de sesión y los roles: este repositorio es público y el nombre se puede leer en él.
- Las sesiones duran 8 horas, se cierran tras 20 minutos sin actividad y una cuenta se bloquea 5 minutos después de 5 intentos
  fallidos.
