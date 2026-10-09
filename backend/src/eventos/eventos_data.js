const almacen = require('../../utils/almacen');

// Registro de lo que se usa en el sistema: búsquedas, accesos por QR, consultas de documentos digitales, comprobantes
// y sesiones de kiosco. Alimenta las estadísticas del panel. Se guarda en el almacén de datos y conserva los últimos
// MAXIMO_DE_EVENTOS (los más antiguos se descartan).
const TIPOS_DEL_CLIENTE = ['busqueda_opac', 'acceso_qr', 'comprobante_impreso', 'sesion_kiosco'];
const TIPOS_DEL_SERVIDOR = ['consulta_digital', 'descarga_digital', 'comprobante_correo'];

const MAXIMO_DE_EVENTOS = 50000;
// Cambian muy seguido y el documento puede llegar a pesar varios MB: se escriben de a poco (con una base de datos, todavía más espaciado).
const ESPERA_PARA_GUARDAR_MS = almacen.usaBaseDeDatos() ? 30000 : 5000;

const estado = almacen.cargar('eventos', { eventos: [] });
const eventos = estado.eventos;

function kioscoValido(kiosco) {
  return typeof kiosco === 'string' && /^[0-9A-Za-z_-]{1,10}$/.test(kiosco) ? kiosco : null;
}

function registrar(tipo, { kiosco = null, tesisId = null } = {}) {
  eventos.push({ tipo, kiosco: kioscoValido(kiosco), tesisId, creadoEn: new Date().toISOString() });
  if (eventos.length > MAXIMO_DE_EVENTOS) eventos.splice(0, eventos.length - MAXIMO_DE_EVENTOS);
  almacen.guardar('eventos', estado, ESPERA_PARA_GUARDAR_MS);
}

function listar() {
  return eventos.slice();
}

module.exports = { TIPOS_DEL_CLIENTE, TIPOS_DEL_SERVIDOR, registrar, listar };
