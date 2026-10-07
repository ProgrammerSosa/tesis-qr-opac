const { enviarComprobante } = require('./comprobantes_data');
const { correoValido } = require('../../utils/codigos');
const { ok, fail } = require('../../utils/httpResponse');

async function postEnviar(req, res) {
  const { tipo, id, codigo, correo, kiosco } = req.body;
  if (!tipo || !id || !codigo || !correo) {
    return fail(res, 'Faltan datos para enviar el comprobante');
  }
  if (!correoValido(correo)) {
    return fail(res, 'El correo no es válido');
  }
  const { mensaje, error, estado } = await enviarComprobante({ tipo, id, codigo, correo: correo.trim(), kiosco });
  if (error) {
    return fail(res, error, estado);
  }
  return ok(res, { enviado: true, simulado: mensaje.simulado, para: mensaje.para }, 'Comprobante enviado');
}

module.exports = { postEnviar };
