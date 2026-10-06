const { TIPOS_DEL_CLIENTE, registrar } = require('./eventos_data');
const { ok, fail } = require('../../utils/httpResponse');

// El navegador avisa de lo que solo él puede saber (una búsqueda, un acceso por QR...).
// Los eventos que ocurren en el servidor (consultas de documentos, correos) los registra el propio servidor.
function postEvento(req, res) {
  const { tipo, kiosco, tesisId } = req.body;
  if (!TIPOS_DEL_CLIENTE.includes(tipo)) {
    return fail(res, 'Tipo de evento invalido');
  }
  registrar(tipo, { kiosco, tesisId: typeof tesisId === 'string' ? tesisId.slice(0, 20) : null });
  return ok(res, { registrado: true });
}

module.exports = { postEvento };
