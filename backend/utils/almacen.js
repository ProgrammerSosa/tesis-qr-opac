const fs = require('node:fs');
const path = require('node:path');
const base = require('./postgres');

// Almacén de datos del sistema: cada tipo de dato (reservas, solicitudes, cuentas, catálogo...) es un documento JSON con nombre. Los
// módulos de datos lo cargan al arrancar (`cargar`), trabajan con él en memoria y piden guardarlo cuando cambia (`guardar`).
//
// Dónde se guarda depende de una variable del servidor:
//  - Con DATABASE_URL, en PostgreSQL (Supabase u otro): una fila por documento en `biblioteca.almacen` (ver backend/sql/esquema.sql).
//    Al arrancar `iniciar` trae todo a memoria; después `cargar` lee de ahí. Así los datos sobreviven a cada publicación del
//    servidor y se pueden ver y exportar desde el panel de Supabase. Solo puede haber una copia del servidor a la vez.
//  - Sin ella, en archivos JSON dentro de la carpeta de datos: backend/data, o la que indique DATA_DIR. Sirve para desarrollar y para
//    un servidor propio con disco que se conserve. Hay que incluir la carpeta en las copias de seguridad.
//
// En los dos casos escribir tarda un instante: varios cambios seguidos se guardan una sola vez, y al apagar el servidor se guarda lo
// que quede pendiente.

const usaBaseDeDatos = () => Boolean(String(process.env.DATABASE_URL || '').trim());

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// --- Archivos --------------------------------------------------------------------------------------------------------

function carpeta() {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', 'data');
}

function archivo(nombre) {
  return path.join(carpeta(), `${nombre}.json`);
}

// Devuelve lo guardado, o `inicial` si todavía no hay nada. Un archivo dañado detiene el arranque a propósito:
// seguir con datos vacíos y luego guardar encima borraría lo que pudiera recuperarse.
function leerArchivo(nombre, inicial) {
  try {
    return JSON.parse(fs.readFileSync(archivo(nombre), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return inicial;
    throw new Error(`No se pudo leer ${archivo(nombre)}: ${error.message}`);
  }
}

function escribirArchivo(nombre, valor) {
  fs.mkdirSync(carpeta(), { recursive: true });
  const destino = archivo(nombre);
  const temporal = `${destino}.tmp`;
  fs.writeFileSync(temporal, JSON.stringify(valor));
  fs.renameSync(temporal, destino); // reemplazo completo: nunca queda un archivo a medias
}

// --- Estado común ----------------------------------------------------------------------------------------------------

const documentos = new Map(); // con base de datos: la copia de trabajo de cada documento
const pendientes = new Map(); // nombre -> { valor, temporizador }
let iniciado = false;
let cola = Promise.resolve(); // las escrituras a la base de datos van una tras otra
let ultimoGuardado = null;
let ultimoError = null;
const reintentos = new Map();
let enVuelo = 0; // escrituras que ya salieron hacia la base de datos y todavía no terminan

// Con una base de datos hay que traer lo guardado antes de que los módulos de datos lo pidan; con archivos no hace falta nada.
async function iniciar({ esperaDelTurnoMs, alEsperarElTurno } = {}) {
  if (iniciado) return;
  if (usaBaseDeDatos()) {
    try {
      await base.abrir();
      await base.tomarElTurno({ esperaMaxMs: esperaDelTurnoMs, alEsperar: alEsperarElTurno });
      await base.prepararEsquema();
      (await base.leerTodo()).forEach((valor, nombre) => documentos.set(nombre, valor));
    } catch (error) {
      await base.cerrar();
      throw error;
    }
    base.alPerderElTurno(() => {
      console.error('[base de datos] Otra copia del servidor tomó el turno: esta se apaga para no pisar sus datos.');
      process.exit(1);
    });
    base.iniciarLatido();
  }
  iniciado = true;
}

function cargar(nombre, inicial) {
  if (!usaBaseDeDatos()) return leerArchivo(nombre, inicial);
  if (!iniciado) {
    throw new Error(`El almacén no está iniciado: «${nombre}» se pidió antes de abrir la base de datos (falta llamar a iniciar)`);
  }
  if (!documentos.has(nombre)) {
    // Lo que todavía no estaba en la base de datos (la primera vez que arranca) se guarda enseguida con sus valores iniciales,
    // para que no quede nada solo en memoria y todo se pueda ver desde el panel de la base de datos.
    guardarEnBase(nombre, inicial, 300);
  }
  return documentos.get(nombre);
}

// --- Guardar: archivos -----------------------------------------------------------------------------------------------

function guardarEnArchivo(nombre, valor, esperaMs) {
  const previo = pendientes.get(nombre);
  if (previo) clearTimeout(previo.temporizador);
  const temporizador = setTimeout(() => {
    pendientes.delete(nombre);
    escribirArchivo(nombre, valor);
    ultimoGuardado = new Date().toISOString();
  }, esperaMs);
  temporizador.unref();
  pendientes.set(nombre, { valor, temporizador });
}

// Escribe ya lo que esté pendiente (al apagar el servidor).
function guardarPendientes() {
  pendientes.forEach(({ valor, temporizador }, nombre) => {
    clearTimeout(temporizador);
    try {
      escribirArchivo(nombre, valor);
    } catch (error) {
      console.error(`No se pudo guardar ${nombre}: ${error.message}`);
    }
  });
  pendientes.clear();
}

// --- Guardar: base de datos ------------------------------------------------------------------------------------------

function encolar(nombre) {
  cola = cola.then(() => escribirPendiente(nombre)).catch(() => {});
  return cola;
}

async function escribirPendiente(nombre) {
  const item = pendientes.get(nombre);
  if (!item) return;
  clearTimeout(item.temporizador);
  pendientes.delete(nombre);
  enVuelo += 1;
  try {
    await base.escribir(nombre, JSON.stringify(item.valor));
    ultimoGuardado = new Date().toISOString();
    ultimoError = null;
    reintentos.delete(nombre);
  } catch (error) {
    ultimoError = { fecha: new Date().toISOString(), documento: nombre, mensaje: base.mensajeSeguro(error) };
    console.error(`[base de datos] No se pudo guardar «${nombre}»: ${ultimoError.mensaje}`);
    if (!pendientes.has(nombre)) {
      // Nadie guardó una versión más nueva mientras tanto: se vuelve a intentar con la actual, cada vez más despacio.
      const intento = (reintentos.get(nombre) ?? 0) + 1;
      reintentos.set(nombre, intento);
      const temporizador = setTimeout(() => encolar(nombre), Math.min(5000 * 2 ** (intento - 1), 60000));
      temporizador.unref();
      pendientes.set(nombre, { valor: item.valor, temporizador });
    }
  } finally {
    enVuelo -= 1;
  }
}

function guardarEnBase(nombre, valor, esperaMs) {
  documentos.set(nombre, valor);
  const previo = pendientes.get(nombre);
  if (previo) clearTimeout(previo.temporizador);
  const temporizador = setTimeout(() => encolar(nombre), esperaMs);
  temporizador.unref();
  pendientes.set(nombre, { valor, temporizador });
}

// Guarda poco después del último cambio: varios cambios seguidos se escriben una sola vez. `valor` es el mismo objeto que usa el
// módulo, así que se escribe tal como esté al momento de guardar. Los datos que cambian muy seguido y pesan más (como los eventos
// de uso) pueden pedir una espera mayor.
function guardar(nombre, valor, esperaMs = 300) {
  if (usaBaseDeDatos()) guardarEnBase(nombre, valor, esperaMs);
  else guardarEnArchivo(nombre, valor, esperaMs);
}

// Lo que quede pendiente se escribe ya. Con base de datos espera a que termine, hasta `limiteMs`.
async function vaciar(limiteMs = 8000) {
  if (!usaBaseDeDatos()) {
    guardarPendientes();
    return;
  }
  [...pendientes.keys()].forEach((nombre) => encolar(nombre));
  await Promise.race([cola, pausa(limiteMs)]);
}

async function apagar() {
  await vaciar();
  if (usaBaseDeDatos()) await base.cerrar();
}

process.on('exit', () => {
  if (!usaBaseDeDatos()) guardarPendientes();
});
['SIGINT', 'SIGTERM'].forEach((senal) => {
  process.on(senal, () => {
    apagar()
      .catch((error) => console.error(`No se pudo guardar al apagar: ${error.message}`))
      .finally(() => process.exit(0));
  });
});
// nodemon reinicia el servidor con SIGUSR2: se guarda y se le devuelve la señal para que pueda continuar.
process.once('SIGUSR2', () => {
  apagar()
    .catch((error) => console.error(`No se pudo guardar al reiniciar: ${error.message}`))
    .finally(() => process.kill(process.pid, 'SIGUSR2'));
});

// --- Para el panel: dónde está todo y un respaldo ------------------------------------------------------------------

function descripcion() {
  return usaBaseDeDatos() ? `PostgreSQL (${base.destino() || 'sin conectar'})` : `archivos en ${carpeta()}`;
}

function archivosDeDatos() {
  try {
    return fs
      .readdirSync(carpeta())
      .filter((nombre) => nombre.endsWith('.json'))
      .map((nombre) => nombre.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

// Qué hay guardado y cómo va: cada documento con su tamaño y su última escritura, lo que espera para guardarse y el último error.
async function situacion() {
  let lista;
  if (usaBaseDeDatos()) {
    try {
      lista = await base.resumen();
    } catch (error) {
      lista = [...documentos.keys()].sort().map((nombre) => ({ nombre, bytes: Buffer.byteLength(JSON.stringify(documentos.get(nombre))), actualizadoEn: null }));
      ultimoError = ultimoError ?? { fecha: new Date().toISOString(), documento: null, mensaje: base.mensajeSeguro(error) };
    }
  } else {
    lista = archivosDeDatos()
      .sort()
      .map((nombre) => {
        const datos = fs.statSync(archivo(nombre));
        return { nombre, bytes: datos.size, actualizadoEn: datos.mtime.toISOString() };
      });
  }
  return {
    modo: usaBaseDeDatos() ? 'postgres' : 'archivos',
    destino: usaBaseDeDatos() ? base.destino() : carpeta(),
    conectado: usaBaseDeDatos() ? base.estaConectado() : null,
    documentos: lista,
    pendientes: pendientes.size + enVuelo,
    ultimoGuardado,
    ultimoError,
  };
}

// Todos los documentos juntos, para descargarlos como respaldo.
function respaldo() {
  if (usaBaseDeDatos()) return Object.fromEntries([...documentos.entries()].sort(([a], [b]) => a.localeCompare(b)));
  guardarPendientes(); // lo que todavía no llegó al disco entra en el respaldo
  return Object.fromEntries(archivosDeDatos().sort().map((nombre) => [nombre, leerArchivo(nombre, null)]));
}

module.exports = { usaBaseDeDatos, iniciar, cargar, guardar, guardarPendientes, vaciar, apagar, descripcion, situacion, respaldo };
