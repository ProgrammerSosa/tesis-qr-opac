const { ANIO_MINIMO_GRADO, ANIO_MINIMO_POSGRADO, TIPOS, crear, buscar, listar, cambiarEstado } = require('./tramites_data');
const notificaciones = require('../notificaciones/notificaciones');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

// Solicitudes de tesis en formato digital y de referencias bibliográficas. Cualquiera puede enviarlas; las atiende el
// personal que corresponde a cada una (tesis, o circulación), y el administrador ambas.

const tiposQueAtiende = (rol) => Object.keys(TIPOS).filter((tipo) => TIPOS[tipo].roles.includes(rol));

function getReglas(req, res) {
  return ok(res, {
    anioMinimoGrado: ANIO_MINIMO_GRADO,
    anioMinimoPosgrado: ANIO_MINIMO_POSGRADO,
    tipos: Object.fromEntries(Object.entries(TIPOS).map(([tipo, datos]) => [tipo, datos.nombre])),
  });
}

function postTramite(req, res) {
  try {
    const tramite = crear(req.params.tipo, req.body);
    notificaciones.tramiteRecibido(tramite);
    return ok(res, tramite, 'Solicitud registrada', 201);
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function getTramites(req, res) {
  const permitidos = tiposQueAtiende(req.sesion.rol);
  return ok(res, listar({ tipo: req.query.tipo, estado: req.query.estado, tipos: permitidos }));
}

function patchEstado(req, res) {
  const existente = buscar(req.params.id);
  if (!existente) return notFound(res, 'Solicitud no encontrada');
  if (!tiposQueAtiende(req.sesion.rol).includes(existente.tipo)) {
    return fail(res, 'Tu rol no atiende este tipo de solicitud', 403);
  }
  try {
    const { estado, observacion, tesisId } = req.body;
    const antes = existente.estado;
    const tramite = cambiarEstado(req.params.id, { estado, observacion, tesisId }, req.sesion);
    registrar(req.sesion, 'tramite.estado', `${tramite.id}: ${antes} → ${tramite.estado}${tramite.observacion && tramite.estado === 'rechazada' ? ` (${tramite.observacion})` : ''}`);
    notificaciones.tramiteAtendido(tramite, process.env.PUBLIC_URL || '');
    return ok(res, tramite);
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

module.exports = { getReglas, postTramite, getTramites, patchEstado };
