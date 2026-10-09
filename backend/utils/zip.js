const zlib = require('node:zlib');

// Lo mínimo del formato ZIP para el respaldo que viaja por correo: armar un archivo .zip con unos pocos archivos comprimidos y volver a
// leerlo. Se usa .zip (y no .gz) porque cualquier computadora lo abre con doble clic y los servicios de correo lo aceptan como adjunto.
// No cubre ZIP64, cifrado ni archivos partidos: no hacen falta para esto.

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(datos) {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i += 1) c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Fecha y hora en el formato de MS-DOS que usa ZIP (hora local, de dos en dos segundos).
function fechaDos(fecha) {
  const hora = (fecha.getHours() << 11) | (fecha.getMinutes() << 5) | Math.floor(fecha.getSeconds() / 2);
  const dia = ((Math.max(fecha.getFullYear(), 1980) - 1980) << 9) | ((fecha.getMonth() + 1) << 5) | fecha.getDate();
  return { hora, dia };
}

// `archivos`: [{ nombre, contenido (Buffer o texto) }]. Devuelve el .zip como Buffer.
function crearZip(archivos, fecha = new Date()) {
  const { hora, dia } = fechaDos(fecha);
  const partes = [];
  const directorio = [];
  let posicion = 0;

  archivos.forEach(({ nombre, contenido }) => {
    const datos = Buffer.isBuffer(contenido) ? contenido : Buffer.from(String(contenido), 'utf8');
    const comprimido = zlib.deflateRawSync(datos, { level: 9 });
    const nombreEnBytes = Buffer.from(nombre, 'utf8');
    const crc = crc32(datos);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versión necesaria: 2.0 (deflate)
    local.writeUInt16LE(0x0800, 6); // el nombre va en UTF-8
    local.writeUInt16LE(8, 8); // método: deflate
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(dia, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(nombreEnBytes.length, 26);
    local.writeUInt16LE(0, 28);
    partes.push(local, nombreEnBytes, comprimido);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(dia, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(nombreEnBytes.length, 28);
    central.writeUInt32LE(posicion, 42); // dónde empieza su encabezado local
    directorio.push(central, nombreEnBytes);

    posicion += local.length + nombreEnBytes.length + comprimido.length;
  });

  const tamanoDelDirectorio = directorio.reduce((suma, parte) => suma + parte.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(archivos.length, 8);
  fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(tamanoDelDirectorio, 12);
  fin.writeUInt32LE(posicion, 16);
  return Buffer.concat([...partes, ...directorio, fin]);
}

const esZip = (datos) => Buffer.isBuffer(datos) && datos.length >= 22 && datos.readUInt32LE(0) === 0x04034b50;

// Lee un .zip (los que arma `crearZip` y los que vuelve a guardar cualquier programa común): devuelve [{ nombre, contenido }].
function leerZip(datos) {
  if (!esZip(datos)) throw new Error('El archivo no es un .zip');
  // El final del directorio está en los últimos bytes (puede seguirle un comentario).
  let fin = -1;
  for (let i = datos.length - 22; i >= Math.max(0, datos.length - 22 - 65535); i -= 1) {
    if (datos.readUInt32LE(i) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin === -1) throw new Error('El .zip está incompleto o dañado');
  const cantidad = datos.readUInt16LE(fin + 10);
  let p = datos.readUInt32LE(fin + 16);

  const archivos = [];
  for (let n = 0; n < cantidad; n += 1) {
    if (p + 46 > datos.length || datos.readUInt32LE(p) !== 0x02014b50) throw new Error('El .zip está dañado');
    const metodo = datos.readUInt16LE(p + 10);
    const crc = datos.readUInt32LE(p + 16);
    const tamanoComprimido = datos.readUInt32LE(p + 20);
    const largoDelNombre = datos.readUInt16LE(p + 28);
    const largoExtra = datos.readUInt16LE(p + 30);
    const largoDelComentario = datos.readUInt16LE(p + 32);
    const local = datos.readUInt32LE(p + 42);
    const nombre = datos.subarray(p + 46, p + 46 + largoDelNombre).toString('utf8');
    p += 46 + largoDelNombre + largoExtra + largoDelComentario;

    if (nombre.endsWith('/')) continue; // una carpeta
    if (local + 30 > datos.length || datos.readUInt32LE(local) !== 0x04034b50) throw new Error('El .zip está dañado');
    const inicio = local + 30 + datos.readUInt16LE(local + 26) + datos.readUInt16LE(local + 28);
    const cuerpo = datos.subarray(inicio, inicio + tamanoComprimido);
    let contenido;
    if (metodo === 0) contenido = Buffer.from(cuerpo);
    else if (metodo === 8) contenido = zlib.inflateRawSync(cuerpo);
    else throw new Error(`El .zip usa un método de compresión que no se puede leer aquí (${metodo})`);
    if (crc32(contenido) !== crc) throw new Error(`El archivo «${nombre}» del .zip está dañado`);
    archivos.push({ nombre, contenido });
  }
  return archivos;
}

module.exports = { crearZip, leerZip, esZip, crc32 };
