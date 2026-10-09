const { buscarReserva } = require('../reservas/reservas_data');
const { buscarSolicitud } = require('../solvencia/solvencia_data');
const { mensajeDeReserva, mensajeDeSolvencia } = require('../notificaciones/notificaciones');
const { enviarCorreo } = require('../../utils/correo');
const { registrar } = require('../eventos/eventos_data');

function buscarRegistro(tipo, id) {
  if (tipo === 'reserva') return buscarReserva(id);
  if (tipo === 'solvencia') return buscarSolicitud(id);
  return null;
}

function mensajeDe(tipo, registro) {
  return { ...(tipo === 'reserva' ? mensajeDeReserva(registro) : mensajeDeSolvencia(registro)), tipo: 'comprobante' };
}

// Manda el comprobante de una reserva o solicitud al correo que la persona indique. Para pedirlo hay que conocer el
// código de confirmación: así nadie puede pedir el comprobante de otra persona solo adivinando un número.
// Devuelve el correo enviado (simulado si el servidor no tiene correo configurado) o un texto de error.
async function enviarComprobante({ tipo, id, codigo, correo, kiosco }) {
  const registro = buscarRegistro(tipo, id);
  if (!registro || registro.codigoConfirmacion !== String(codigo || '').trim().toUpperCase()) {
    return { error: 'No encontramos ese comprobante con ese código', estado: 404 };
  }
  try {
    const mensaje = await enviarCorreo({ para: correo, ...mensajeDe(tipo, registro) });
    registrar('comprobante_correo', { kiosco });
    return { mensaje };
  } catch (error) {
    console.error(`No se pudo enviar el comprobante ${id}: ${error.message}`);
    return { error: 'No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.', estado: 502 };
  }
}

module.exports = { enviarComprobante };
