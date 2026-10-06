// Registro en memoria de lo que se usa en el sistema: búsquedas, accesos por QR, consultas
// de documentos digitales, comprobantes y sesiones de kiosco. Alimenta las estadísticas del panel.
const TIPOS_DEL_CLIENTE = ['busqueda_opac', 'acceso_qr', 'comprobante_impreso', 'sesion_kiosco'];
const TIPOS_DEL_SERVIDOR = ['consulta_digital', 'descarga_digital', 'comprobante_correo'];

const eventos = [];

function kioscoValido(kiosco) {
  return typeof kiosco === 'string' && /^[0-9A-Za-z_-]{1,10}$/.test(kiosco) ? kiosco : null;
}

function registrar(tipo, { kiosco = null, tesisId = null } = {}) {
  eventos.push({ tipo, kiosco: kioscoValido(kiosco), tesisId, creadoEn: new Date().toISOString() });
}

function listar() {
  return eventos.slice();
}

module.exports = { TIPOS_DEL_CLIENTE, TIPOS_DEL_SERVIDOR, registrar, listar };
