const biblioteca = require('../../utils/biblioteca');
const { avisarPorCorreo } = require('../../utils/correo');

// Los correos que el sistema manda a las personas: el comprobante de una reserva o de una solicitud de solvencia (propuesta,
// sección 4.5.5, "comprobante digital"). Aquí solo se redacta el texto; el envío (real o simulado) lo hace utils/correo.js.

function fechaYHora(iso) {
  const d = new Date(iso);
  const dos = (n) => String(n).padStart(2, '0');
  return { fecha: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`, hora: `${dos(d.getHours())}:${dos(d.getMinutes())}` };
}

// "jueves 8 de octubre de 2026" a partir de "2026-10-08".
function fechaLarga(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function carta(titulo, lineas, cierre) {
  return [biblioteca.nombre, biblioteca.facultad, '', titulo, '', ...lineas, ...(cierre ? ['', cierre] : [])].join('\n');
}

// --- Textos ---------------------------------------------------------------------------------------------------------

function textoDeReserva(r) {
  const { fecha, hora } = fechaYHora(r.creadoEn);
  const horario = `${r.fecha} de ${r.hora} a ${r.horaFin}${r.duracion > 1 ? ` (${r.duracion} horas)` : ''}`;
  return carta(
    'Confirmación de reserva',
    [
      `Fecha de la operación: ${fecha}    Hora: ${hora}`,
      `Número de reserva: ${r.id}`,
      `Código de confirmación: ${r.codigoConfirmacion}`,
      `Espacio: ${r.recursoNombre}${r.modalidadNombre ? ` (${r.modalidadNombre})` : ''}`,
      `Horario de uso: ${horario}`,
      `A nombre de: ${r.solicitante}`,
    ],
    'Presenta el número de reserva o el código de confirmación en el mostrador. Si no te presentas dentro del tiempo de tolerancia, la reserva se libera. La biblioteca puede cancelar una reserva si se incumple el reglamento del servicio.'
  );
}

function textoDeSolvencia(s) {
  const { fecha, hora } = fechaYHora(s.creadoEn);
  const entrega = s.entregaEstimada ? `${fechaLarga(s.entregaEstimada.fecha)}, a las ${s.entregaEstimada.hora}` : null;
  return carta(
    'Solicitud de solvencia recibida',
    [
      `Fecha de la operación: ${fecha}    Hora: ${hora}`,
      `Número de solicitud: ${s.id}`,
      `Código de confirmación: ${s.codigoConfirmacion}`,
      `Motivo: ${s.motivo}`,
      `Solicitante: ${s.solicitante}`,
      ...(s.identificacion ? [`Carné: ${s.identificacion}`] : []),
      ...(s.fechaPapeleria ? [`Fecha en que presentarás tu papelería: ${fechaLarga(s.fechaPapeleria)}`] : []),
      ...(entrega ? [`Entrega estimada: ${entrega}`] : []),
    ],
    'Tu solicitud será revisada por el personal de la biblioteca. Revisa que tus datos estén correctos: si la solvencia se emite con datos incorrectos (nombres, CUI, carné o fecha) no hay reposición y habría que pagar y tramitarla de nuevo.'
  );
}

// --- Envíos ---------------------------------------------------------------------------------------------------------

// Si la persona dejó un correo al reservar, se le manda el comprobante sin que tenga que pedirlo.
function reservaConfirmada(reserva) {
  return avisarPorCorreo({ para: reserva.correo, asunto: `Confirmación de reserva ${reserva.id}`, texto: textoDeReserva(reserva) });
}

function solvenciaRecibida(solicitud) {
  return avisarPorCorreo({ para: solicitud.correo, asunto: `Solicitud de solvencia ${solicitud.id} recibida`, texto: textoDeSolvencia(solicitud) });
}

module.exports = { textoDeReserva, textoDeSolvencia, reservaConfirmada, solvenciaRecibida };
