const { MOTIVOS, crear, listar, avanzarEstado, rechazar, resumen } = require('./solvencia_data');
const { correoValido } = require('../../utils/codigos');
const { ok, fail, notFound } = require('../../utils/httpResponse');

function getMotivos(req, res) {
  return ok(res, MOTIVOS);
}

function postSolicitud(req, res) {
  const { solicitante, identificacion, programa, motivo, correo, kiosco } = req.body;
  if (!solicitante || !identificacion || !programa || !motivo) {
    return fail(res, 'Faltan datos del formulario');
  }
  if (!MOTIVOS.includes(motivo)) {
    return fail(res, 'Motivo invalido');
  }
  const correoLimpio = String(correo || '').trim();
  if (correoLimpio && !correoValido(correoLimpio)) {
    return fail(res, 'El correo no es válido');
  }
  const solicitud = crear({ solicitante, identificacion, programa, motivo, correo: correoLimpio, kiosco });
  return ok(res, solicitud, 'Solicitud registrada');
}

function getSolicitudes(req, res) {
  return ok(res, listar());
}

function patchAvanzar(req, res) {
  const solicitud = avanzarEstado(req.params.id);
  if (!solicitud) return notFound(res, 'Solicitud no encontrada');
  return ok(res, solicitud);
}

function patchRechazar(req, res) {
  const solicitud = rechazar(req.params.id);
  if (!solicitud) return notFound(res, 'Solicitud no encontrada');
  return ok(res, solicitud);
}

function getResumen(req, res) {
  return ok(res, resumen());
}

module.exports = { getMotivos, postSolicitud, getSolicitudes, patchAvanzar, patchRechazar, getResumen };
