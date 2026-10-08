const {
  MOTIVOS,
  DIAS_MAXIMOS_DE_ANTICIPACION,
  entregaEstimada,
  crear,
  listar,
  buscarSolicitud,
  avanzarEstado,
  rechazar,
  resumen,
} = require('./solvencia_data');
const notificaciones = require('../notificaciones/notificaciones');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

const TEXTO_DE_ESTADO = { pendiente: 'pendiente', en_revision: 'en revisión', aprobada: 'aprobada' };

function getMotivos(req, res) {
  return ok(res, MOTIVOS);
}

// Lo que el formulario necesita saber: los motivos, con cuántos días de anticipación se pide y cuándo se entregaría
// una solicitud enviada en este momento.
function getReglas(req, res) {
  return ok(res, { motivos: MOTIVOS, diasMaximosDeAnticipacion: DIAS_MAXIMOS_DE_ANTICIPACION, entregaSiEnviasAhora: entregaEstimada() });
}

function postSolicitud(req, res) {
  try {
    const solicitud = crear(req.body);
    notificaciones.solvenciaRecibida(solicitud); // el aviso por correo no detiene la solicitud si falla
    return ok(res, solicitud, 'Solicitud registrada');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function getSolicitudes(req, res) {
  return ok(res, listar());
}

function patchAvanzar(req, res) {
  const antes = buscarSolicitud(req.params.id)?.estado;
  const solicitud = avanzarEstado(req.params.id);
  if (!solicitud) return notFound(res, 'Solicitud no encontrada');
  if (solicitud.estado !== antes) {
    registrar(req.sesion, 'solicitud.avanzada', `${solicitud.id}: ${TEXTO_DE_ESTADO[antes]} → ${TEXTO_DE_ESTADO[solicitud.estado]}`);
  }
  return ok(res, solicitud);
}

function patchRechazar(req, res) {
  try {
    const solicitud = rechazar(req.params.id, req.body?.observacion);
    if (!solicitud) return notFound(res, 'Solicitud no encontrada');
    registrar(req.sesion, 'solicitud.rechazada', solicitud.observacion ? `${solicitud.id}: ${solicitud.observacion}` : solicitud.id);
    return ok(res, solicitud);
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function getResumen(req, res) {
  return ok(res, resumen());
}

module.exports = { getMotivos, getReglas, postSolicitud, getSolicitudes, patchAvanzar, patchRechazar, getResumen };
