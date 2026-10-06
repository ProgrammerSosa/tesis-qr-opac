const biblioteca = require('../../utils/biblioteca');
const { buscarReserva } = require('../reservas/reservas_data');
const { buscarSolicitud } = require('../solvencia/solvencia_data');
const { registrar } = require('../eventos/eventos_data');

// Correos "enviados". Este prototipo no tiene servidor de correo: el mensaje se arma completo y se guarda aquí;
// con el servidor de correo de la Facultad, `enviarCorreo` sería el único lugar que habría que cambiar.
const salida = [];

function fechaYHora(iso) {
  const d = new Date(iso);
  const dos = (n) => String(n).padStart(2, '0');
  return { fecha: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`, hora: `${dos(d.getHours())}:${dos(d.getMinutes())}` };
}

function textoDeReserva(r) {
  const { fecha, hora } = fechaYHora(r.creadoEn);
  const horario = `${r.fecha} de ${r.hora} a ${r.horaFin}${r.duracion > 1 ? ` (${r.duracion} horas)` : ''}`;
  return [
    biblioteca.nombre,
    'Confirmación de reserva',
    '',
    `Fecha de la operación: ${fecha}    Hora: ${hora}`,
    `Número de reserva: ${r.id}`,
    `Código de confirmación: ${r.codigoConfirmacion}`,
    `Espacio: ${r.recursoNombre}${r.modalidadNombre ? ` (${r.modalidadNombre})` : ''}`,
    `Horario de uso: ${horario}`,
    `A nombre de: ${r.solicitante}`,
    '',
    'Presenta el número de reserva o el código de confirmación en el mostrador. Si no te presentas dentro de la tolerancia, la reserva se libera.',
  ].join('\n');
}

function textoDeSolicitud(s) {
  const { fecha, hora } = fechaYHora(s.creadoEn);
  return [
    biblioteca.nombre,
    'Solicitud de solvencia',
    '',
    `Fecha de la operación: ${fecha}    Hora: ${hora}`,
    `Número de solicitud: ${s.id}`,
    `Código de confirmación: ${s.codigoConfirmacion}`,
    `Motivo: ${s.motivo}`,
    `Solicitante: ${s.solicitante}`,
    '',
    'Tu solicitud será revisada por el personal de la biblioteca.',
  ].join('\n');
}

// Devuelve el correo enviado, o un texto de error. Para pedir el comprobante hay que conocer el código de
// confirmación: así nadie puede pedir el comprobante de otra persona solo adivinando un número.
function enviarComprobante({ tipo, id, codigo, correo, kiosco }) {
  const registro = tipo === 'reserva' ? buscarReserva(id) : tipo === 'solvencia' ? buscarSolicitud(id) : null;
  if (!registro || registro.codigoConfirmacion !== String(codigo || '').trim().toUpperCase()) {
    return { error: 'No encontramos ese comprobante con ese código', estado: 404 };
  }
  const mensaje = {
    para: correo,
    asunto: `${tipo === 'reserva' ? 'Confirmación de reserva' : 'Solicitud de solvencia'} ${registro.id}`,
    cuerpo: tipo === 'reserva' ? textoDeReserva(registro) : textoDeSolicitud(registro),
    enviadoEn: new Date().toISOString(),
    simulado: true,
  };
  salida.push(mensaje);
  registrar('comprobante_correo', { kiosco });
  return { mensaje };
}

module.exports = { enviarComprobante };
