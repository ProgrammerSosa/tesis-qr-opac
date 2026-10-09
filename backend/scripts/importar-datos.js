// Pasa a la base de datos PostgreSQL lo que ya estaba guardado en archivos (o en un respaldo descargado del panel).
//
//   npm run importar                         importa los archivos de DATA_DIR (o de backend/data)
//   npm run importar -- ruta/a/una/carpeta   importa los .json de esa carpeta
//   npm run importar -- respaldo.json        importa un respaldo descargado del panel (sección «Datos y respaldo»)
//   npm run importar -- respaldo.zip         importa el respaldo que llega por correo (el .zip tal cual)
//   npm run importar -- --forzar             reemplaza también los documentos que ya existan en la base de datos
//
// Hace falta DATABASE_URL (en backend/.env o en el entorno). Si hay un servidor encendido usando esa base de datos, se niega: el
// servidor guardaría encima lo que se importe. Apaga el servidor, importa y vuelve a encenderlo.
const fs = require('node:fs');
const path = require('node:path');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const base = require('../utils/postgres');
const { leerZip, esZip } = require('../utils/zip');

// Un respaldo no lleva la sal ni la clave cifrada de las cuentas (no deben viajar en un archivo): ese documento no se importa.
const SIN_IMPORTAR = new Set(['cuentas']);
// Lo que es del funcionamiento del servidor y no de la biblioteca (sesiones abiertas, cuándo salió el último respaldo) no se importa.
const NUNCA = new Set(['sesiones', 'respaldos']);

function leerCarpeta(carpeta) {
  return Object.fromEntries(
    fs
      .readdirSync(carpeta)
      .filter((nombre) => nombre.endsWith('.json'))
      .sort()
      .map((nombre) => [nombre.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(carpeta, nombre), 'utf8'))])
  );
}

// El respaldo que llega por correo es un .zip con el .json adentro.
function textoDelArchivo(origen) {
  const datos = fs.readFileSync(origen);
  if (!esZip(datos)) return datos.toString('utf8');
  const json = leerZip(datos).find((archivo) => archivo.nombre.toLowerCase().endsWith('.json'));
  if (!json) throw new Error(`${origen} no trae ningún archivo .json adentro`);
  return json.contenido.toString('utf8');
}

function leerOrigen(origen) {
  const estado = fs.statSync(origen);
  if (estado.isDirectory()) return { documentos: leerCarpeta(origen), esRespaldo: false };
  const contenido = JSON.parse(textoDelArchivo(origen));
  if (contenido && typeof contenido === 'object' && contenido.documentos && typeof contenido.documentos === 'object') {
    return { documentos: contenido.documentos, esRespaldo: true };
  }
  return { documentos: contenido, esRespaldo: false };
}

async function principal() {
  const argumentos = process.argv.slice(2);
  const forzar = argumentos.includes('--forzar');
  const origen = argumentos.find((a) => !a.startsWith('--')) || (process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', 'data'));

  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL: sin ella no hay a dónde importar. Escríbela en backend/.env (modelo en backend/.env.example).');
  }
  if (!fs.existsSync(origen)) throw new Error(`No existe ${origen}`);

  const { documentos, esRespaldo } = leerOrigen(origen);
  const nombres = Object.keys(documentos).sort();
  if (nombres.length === 0) throw new Error(`No encontré documentos para importar en ${origen}`);
  console.log(`Origen: ${origen} (${nombres.length} documentos${esRespaldo ? ', respaldo del panel' : ''})`);

  await base.abrir();
  try {
    if (!(await base.probarTurno())) {
      throw new Error('Hay un servidor encendido usando esta base de datos. Apágalo, importa y vuelve a encenderlo: si no, guardaría encima de lo importado.');
    }
    await base.prepararEsquema();
    const existentes = await base.leerTodo();
    console.log(`Destino: ${base.destino()} (${existentes.size} documentos ya guardados)`);

    let importados = 0;
    for (const nombre of nombres) {
      if (NUNCA.has(nombre)) {
        console.log(`  omitido   ${nombre}: es del funcionamiento del servidor, no se importa`);
      } else if (SIN_IMPORTAR.has(nombre) && esRespaldo) {
        console.log(`  omitido   ${nombre}: un respaldo no trae las claves; las cuentas se crean desde el panel`);
      } else if (existentes.has(nombre) && !forzar) {
        console.log(`  omitido   ${nombre}: ya existe en la base de datos (usa --forzar para reemplazarlo)`);
      } else {
        await base.escribir(nombre, JSON.stringify(documentos[nombre]));
        importados += 1;
        console.log(`  importado ${nombre}${existentes.has(nombre) ? ' (reemplazó al que había)' : ''}`);
      }
    }
    console.log(`Listo: ${importados} de ${nombres.length} documentos importados.`);
  } finally {
    await base.cerrar();
  }
}

principal().catch(async (error) => {
  console.error(`No se pudo importar: ${error.message}`);
  await base.cerrar().catch(() => {});
  process.exit(1);
});
