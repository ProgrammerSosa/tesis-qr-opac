const fs = require('node:fs');
const path = require('node:path');

// Almacén de datos del sistema: cada tipo de dato (reservas, solicitudes, cuentas...) se guarda en su propio archivo
// JSON dentro de la carpeta de datos, para que no se pierda al reiniciar el servidor. Es suficiente para una sola
// instalación; si la biblioteca crece, estas dos funciones (`cargar` y `guardar`) son lo único que habría que cambiar
// por consultas a una base de datos.
//
// La carpeta es backend/data, o la que se indique con la variable DATA_DIR. Hay que incluirla en las copias de seguridad.

function carpeta() {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', 'data');
}

function archivo(nombre) {
  return path.join(carpeta(), `${nombre}.json`);
}

// Devuelve lo guardado, o `inicial` si todavía no hay nada. Un archivo dañado detiene el arranque a propósito:
// seguir con datos vacíos y luego guardar encima borraría lo que pudiera recuperarse.
function cargar(nombre, inicial) {
  try {
    return JSON.parse(fs.readFileSync(archivo(nombre), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return inicial;
    throw new Error(`No se pudo leer ${archivo(nombre)}: ${error.message}`);
  }
}

function escribir(nombre, valor) {
  fs.mkdirSync(carpeta(), { recursive: true });
  const destino = archivo(nombre);
  const temporal = `${destino}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(valor));
  fs.renameSync(temporal, destino); // reemplazo completo: nunca queda un archivo a medias
}

const pendientes = new Map(); // nombre -> { valor, temporizador }

// Guarda poco después del último cambio: varios cambios seguidos se escriben una sola vez. `valor` es el mismo
// objeto que usa el módulo, así que se escribe tal como esté al momento de guardar. Los datos que cambian muy seguido
// y pesan más (como los eventos de uso) pueden pedir una espera mayor.
function guardar(nombre, valor, esperaMs = 300) {
  const previo = pendientes.get(nombre);
  if (previo) clearTimeout(previo.temporizador);
  const temporizador = setTimeout(() => {
    pendientes.delete(nombre);
    escribir(nombre, valor);
  }, esperaMs);
  temporizador.unref();
  pendientes.set(nombre, { valor, temporizador });
}

// Escribe ya lo que esté pendiente (al apagar el servidor).
function guardarPendientes() {
  pendientes.forEach(({ valor, temporizador }, nombre) => {
    clearTimeout(temporizador);
    try {
      escribir(nombre, valor);
    } catch (error) {
      console.error(`No se pudo guardar ${nombre}: ${error.message}`);
    }
  });
  pendientes.clear();
}

process.on('exit', guardarPendientes);
['SIGINT', 'SIGTERM'].forEach((senal) => {
  process.on(senal, () => {
    guardarPendientes();
    process.exit(0);
  });
});
// nodemon reinicia el servidor con SIGUSR2: se guarda y se le devuelve la señal para que pueda continuar.
process.once('SIGUSR2', () => {
  guardarPendientes();
  process.kill(process.pid, 'SIGUSR2');
});

module.exports = { cargar, guardar, guardarPendientes };
