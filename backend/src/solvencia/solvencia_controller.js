const { MOTIVOS, crear, listar, buscarSolicitud, avanzarEstado, rechazar, resumen } = require('./solvencia_data');
const { registrar } = require('../actividad/actividad_data');
const { correoValido } = require('../../utils/codigos');
const { ok, fail, notFound } = require('../../utils/httpResponse');

const TEXTO_DE_ESTADO = { pendiente: 'pendiente', en_revision: 'en revisión', aprobada: 'aprobada' };

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
  const antes = buscarSolicitud(req.params.id)?.estado;
  const solicitud = avanzarEstado(req.params.id);
  if (!solicitud) return notFound(res, 'Solicitud no encontrada');
  if (solicitud.estado !== antes) {
    registrar(req.sesion, 'solicitud.avanzada', `${solicitud.id}: ${TEXTO_DE_ESTADO[antes]} → ${TEXTO_DE_ESTADO[solicitud.estado]}`);
  }
  return ok(res, solicitud);
}

function patchRechazar(req, res) {
  const solicitud = rechazar(req.params.id);
  if (!solicitud) return notFound(res, 'Solicitud no encontrada');
  registrar(req.sesion, 'solicitud.rechazada', solicitud.id);
  return ok(res, solicitud);
}

function getResumen(req, res) {
  return ok(res, resumen());
}

module.exports = { getMotivos, postSolicitud, getSolicitudes, patchAvanzar, patchRechazar, getResumen };
