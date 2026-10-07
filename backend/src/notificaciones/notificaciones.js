const biblioteca = require('../../utils/biblioteca');
const { avisarPorCorreo } = require('../../utils/correo');
const { TIPOS } = require('../tramites/tramites_data');

// Los correos que el sistema manda a las personas: confirmación al hacer una reserva o una solicitud, y el aviso cuando
// el personal la atiende. Aquí solo se redacta el texto; el envío (real o simulado) lo hace utils/correo.js.

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
    'Revisa que tus datos estén correctos. Si encuentras un error, envía una nueva solicitud: si la solvencia se emite con datos incorrectos (nombres, CUI, carné o fecha) no hay reposición y habría que pagar y tramitarla de nuevo.'
  );
}

function textoDeTramiteRecibido(t) {
  const { fecha, hora } = fechaYHora(t.creadoEn);
  const detalle =
    t.tipo === 'tesis_digital'
      ? [`Tesis: ${t.titulo}`, `Autor: ${t.autor}`, `Clasificación: ${t.clasificacion} (${t.nivel}, ${t.anio})`]
      : [`Tema: ${t.tema}`, `Fuente: ${t.fuente}`];
  return carta(
    `${TIPOS[t.tipo].nombre} recibida`,
    [`Fecha de la operación: ${fecha}    Hora: ${hora}`, `Número de solicitud: ${t.id}`, `Código de confirmación: ${t.codigoConfirmacion}`, ...detalle, `Solicitante: ${t.solicitante}`],
    t.tipo === 'tesis_digital'
      ? 'Te avisaremos por este medio cuando la tesis esté disponible en el repositorio para consultarla o descargarla.'
      : 'Recibirás tu referencia por este medio en un plazo de 24 horas, en días y horas hábiles.'
  );
}

// --- Envíos ---------------------------------------------------------------------------------------------------------

// Si la persona dejó un correo al reservar, se le manda la confirmación sin que tenga que pedirla.
function reservaConfirmada(reserva) {
  return avisarPorCorreo({ para: reserva.correo, asunto: `Confirmación de reserva ${reserva.id}`, texto: textoDeReserva(reserva) });
}

function solvenciaRecibida(solicitud) {
  return avisarPorCorreo({ para: solicitud.correo, asunto: `Solicitud de solvencia ${solicitud.id} recibida`, texto: textoDeSolvencia(solicitud) });
}

function solvenciaAprobada(solicitud) {
  const entrega = solicitud.entregaEstimada ? `${fechaLarga(solicitud.entregaEstimada.fecha)}, a las ${solicitud.entregaEstimada.hora}` : 'el horario de entrega de solvencias';
  return avisarPorCorreo({
    para: solicitud.correo,
    asunto: `Tu solvencia ${solicitud.id} fue aprobada`,
    texto: carta('Solvencia aprobada', [`Número de solicitud: ${solicitud.id}`, `Solicitante: ${solicitud.solicitante}`, `Entrega: ${entrega}`], 'La entrega se hace de lunes a viernes, salvo días de asueto.'),
  });
}

function solvenciaRechazada(solicitud) {
  return avisarPorCorreo({
    para: solicitud.correo,
    asunto: `Tu solicitud de solvencia ${solicitud.id} no pudo atenderse`,
    texto: carta('Solicitud de solvencia no atendida', [`Número de solicitud: ${solicitud.id}`, `Motivo: ${solicitud.observacion}`], 'Si necesitas la solvencia, envía una nueva solicitud con los datos corregidos.'),
  });
}

function tramiteRecibido(tramite) {
  return avisarPorCorreo({ para: tramite.correo, asunto: `${TIPOS[tramite.tipo].nombre} ${tramite.id} recibida`, texto: textoDeTramiteRecibido(tramite) });
}

// Avisa a la persona de lo que decidió el personal: tesis publicada, referencia respondida o solicitud no atendida.
// `enlaceBase` es la dirección pública del sitio (si se conoce) para poner el enlace a la tesis.
function tramiteAtendido(tramite, enlaceBase = '') {
  if (tramite.estado === 'publicada') {
    const enlace = tramite.tesisId && enlaceBase ? [`Puedes consultarla aquí: ${enlaceBase}/tesis/${tramite.tesisId}`] : ['Ya puedes buscarla en el catálogo de tesis del sitio de la biblioteca.'];
    return avisarPorCorreo({
      para: tramite.correo,
      asunto: `Tu tesis ya está disponible (${tramite.id})`,
      texto: carta('Tesis disponible en formato digital', [`Número de solicitud: ${tramite.id}`, `Tesis: ${tramite.titulo}`, ...enlace, ...(tramite.observacion ? [tramite.observacion] : [])]),
    });
  }
  if (tramite.estado === 'respondida') {
    return avisarPorCorreo({
      para: tramite.correo,
      asunto: `Respuesta a tu solicitud de referencias (${tramite.id})`,
      texto: carta('Referencias bibliográficas', [`Número de solicitud: ${tramite.id}`, `Tema: ${tramite.tema}`, '', tramite.observacion]),
    });
  }
  if (tramite.estado === 'rechazada') {
    return avisarPorCorreo({
      para: tramite.correo,
      asunto: `Tu solicitud ${tramite.id} no pudo atenderse`,
      texto: carta(`${TIPOS[tramite.tipo].nombre} no atendida`, [`Número de solicitud: ${tramite.id}`, `Motivo: ${tramite.observacion}`]),
    });
  }
  return null;
}

module.exports = {
  textoDeReserva,
  textoDeSolvencia,
  textoDeTramiteRecibido,
  reservaConfirmada,
  solvenciaRecibida,
  solvenciaAprobada,
  solvenciaRechazada,
  tramiteRecibido,
  tramiteAtendido,
};
