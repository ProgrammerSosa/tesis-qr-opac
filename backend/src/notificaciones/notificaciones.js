const { avisarPorCorreo } = require('../../utils/correo');
const { plantilla } = require('../../utils/plantillaCorreo');

// Los correos que el sistema manda a las personas: el comprobante de una reserva o de una solicitud de solvencia (propuesta,
// sección 4.5.5, "comprobante digital"). Aquí solo se redacta el mensaje (texto y HTML, ver utils/plantillaCorreo.js); el envío
// (real o simulado) lo hace utils/correo.js.

function fechaYHora(iso) {
  const d = new Date(iso);
  const dos = (n) => String(n).padStart(2, '0');
  return { fecha: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`, hora: `${dos(d.getHours())}:${dos(d.getMinutes())}` };
}

// "jueves 8 de octubre de 2026" a partir de "2026-10-08".
function fechaLarga(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// --- Mensajes -------------------------------------------------------------------------------------------------------

function mensajeDeReserva(r) {
  const { fecha, hora } = fechaYHora(r.creadoEn);
  const horas = `de ${r.hora} a ${r.horaFin}${r.duracion > 1 ? ` (${r.duracion} horas)` : ''}`;
  return {
    tipo: 'reserva',
    asunto: `Confirmación de reserva ${r.id}`,
    ...plantilla({
      titulo: 'Confirmación de reserva',
      previa: `${r.recursoNombre}, ${fechaLarga(r.fecha)}, ${horas}`,
      filas: [
        ['Fecha de la operación', `${fecha} · ${hora}`],
        ['Número de reserva', r.id, 'codigo'],
        ['Código de confirmación', r.codigoConfirmacion, 'codigo'],
        ['Lugar', r.recursoNombre],
        ['Horario de uso', `${fechaLarga(r.fecha)}, ${horas}`],
        ['A nombre de', r.solicitante],
      ],
      parrafos: [
        'Presenta el número de reserva o el código de confirmación en el mostrador. Si no te presentas dentro del tiempo de tolerancia, la reserva se libera. La biblioteca puede cancelar una reserva si se incumple el reglamento del servicio.',
      ],
    }),
  };
}

function mensajeDeSolvencia(s) {
  const { fecha, hora } = fechaYHora(s.creadoEn);
  const entrega = s.entregaEstimada ? `${fechaLarga(s.entregaEstimada.fecha)}, a las ${s.entregaEstimada.hora}` : null;
  return {
    tipo: 'solvencia',
    asunto: `Solicitud de solvencia ${s.id} recibida`,
    ...plantilla({
      titulo: 'Solicitud de solvencia recibida',
      previa: `Solicitud ${s.id}: ${s.motivo}`,
      filas: [
        ['Fecha de la operación', `${fecha} · ${hora}`],
        ['Número de solicitud', s.id, 'codigo'],
        ['Código de confirmación', s.codigoConfirmacion, 'codigo'],
        ['Motivo', s.motivo],
        ['Solicitante', s.solicitante],
        ...(s.identificacion ? [['Carné', s.identificacion]] : []),
        ...(s.fechaPapeleria ? [['Presentas tu papelería el', fechaLarga(s.fechaPapeleria)]] : []),
        ...(entrega ? [['Entrega estimada', entrega]] : []),
      ],
      parrafos: [
        'Tu solicitud será revisada por el personal de la biblioteca. Revisa que tus datos estén correctos: si la solvencia se emite con datos incorrectos (nombres, CUI, carné o fecha) no hay reposición y habría que pagar y tramitarla de nuevo.',
      ],
    }),
  };
}

// Para que el administrador compruebe desde el panel que el servidor sí puede enviar correos.
function mensajeDePrueba({ quien, cuando = new Date() }) {
  const { fecha, hora } = fechaYHora(cuando.toISOString());
  return {
    tipo: 'prueba',
    asunto: 'Correo de prueba de la biblioteca',
    ...plantilla({
      titulo: 'Correo de prueba',
      previa: 'Si lees esto, el correo de la biblioteca funciona.',
      filas: [
        ['Enviado por', quien],
        ['Fecha', `${fecha} · ${hora}`],
      ],
      parrafos: ['Si recibiste este mensaje, el servidor de la biblioteca puede enviar correos: los comprobantes de reservas y de solicitudes llegarán a quien los pida.'],
    }),
  };
}

// Los textos planos, tal como los pide el envío de comprobantes.
const textoDeReserva = (r) => mensajeDeReserva(r).texto;
const textoDeSolvencia = (s) => mensajeDeSolvencia(s).texto;

// --- Envíos ---------------------------------------------------------------------------------------------------------

// Si la persona dejó un correo al reservar, se le manda el comprobante sin que tenga que pedirlo.
function reservaConfirmada(reserva) {
  return avisarPorCorreo({ para: reserva.correo, ...mensajeDeReserva(reserva) });
}

function solvenciaRecibida(solicitud) {
  return avisarPorCorreo({ para: solicitud.correo, ...mensajeDeSolvencia(solicitud) });
}

module.exports = {
  mensajeDeReserva,
  mensajeDeSolvencia,
  mensajeDePrueba,
  textoDeReserva,
  textoDeSolvencia,
  reservaConfirmada,
  solvenciaRecibida,
};
