const {
  disponibilidad,
  crearReserva,
  listarReservas,
  avanzarEstado,
  cancelarReserva,
  liberarReserva,
  buscarReserva,
  resumen,
} = require('./reservas_data');
const { REGLAS_CUBICULO, CONDICIONES } = require('./recursos_data');
const configuracion = require('../configuracion/configuracion_data');
const notificaciones = require('../notificaciones/notificaciones');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

const TIPOS_VALIDOS = ['cubiculo', 'estacion', 'sala_lectura'];

const TEXTO_DE_ESTADO = { reservado: 'reservado', en_uso: 'en uso', finalizado: 'finalizado' };
const ESTADO_SIGUIENTE = { reservado: 'en_uso', en_uso: 'finalizado' };

function validarTipo(req, res) {
  if (!TIPOS_VALIDOS.includes(req.params.tipo)) {
    fail(res, 'Tipo de recurso invalido', 404);
    return false;
  }
  return true;
}

function getDisponibilidad(req, res) {
  if (!validarTipo(req, res)) return;
  const { fecha } = req.query;
  if (!fecha) return fail(res, 'Debes indicar una fecha');
  return ok(res, disponibilidad(req.params.tipo, fecha));
}

function postReserva(req, res) {
  if (!validarTipo(req, res)) return;
  const { recursoId, fecha, hora, solicitante, identificacion, correo, kiosco, modalidad, duracion } = req.body;
  if (!recursoId || !fecha || !hora || !solicitante) {
    return fail(res, 'Faltan datos de la reserva');
  }
  try {
    const reserva = crearReserva({
      tipo: req.params.tipo,
      recursoId,
      fecha,
      hora,
      solicitante,
      identificacion,
      correo,
      kiosco,
      modalidad,
      duracion,
    });
    notificaciones.reservaConfirmada(reserva); // si dejó un correo, recibe la confirmación; si el correo falla, la reserva sigue en pie
    return ok(res, reserva, 'Reserva creada');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function getReglas(req, res) {
  return ok(res, REGLAS_CUBICULO);
}

// Condiciones generales de uso que se muestran antes de reservar, con los minutos de tolerancia y las reservas
// pausadas que el administrador tenga en la configuración.
function getCondiciones(req, res) {
  return ok(res, {
    ...CONDICIONES,
    toleranciaMinutos: configuracion.toleranciaMinutos(),
    pausadas: configuracion.tiposPausados(),
  });
}

function getReservas(req, res) {
  return ok(res, listarReservas({ tipo: req.query.tipo }));
}

function patchAvanzar(req, res) {
  const antes = buscarReserva(req.params.id)?.estado;
  const reserva = avanzarEstado(req.params.id);
  if (!reserva) return notFound(res, 'Reserva no encontrada');
  if (reserva.estado === ESTADO_SIGUIENTE[antes]) {
    registrar(req.sesion, 'reserva.avanzada', `${reserva.id}: ${TEXTO_DE_ESTADO[antes]} → ${TEXTO_DE_ESTADO[reserva.estado]}`);
  }
  return ok(res, reserva);
}

function patchCancelar(req, res) {
  const reserva = cancelarReserva(req.params.id);
  if (!reserva) return notFound(res, 'Reserva no encontrada');
  registrar(req.sesion, 'reserva.cancelada', reserva.id);
  return ok(res, reserva);
}

function patchLiberar(req, res) {
  try {
    const reserva = liberarReserva(req.params.id);
    if (!reserva) return notFound(res, 'Reserva no encontrada');
    registrar(req.sesion, 'reserva.liberada', reserva.id);
    return ok(res, reserva, 'Lugar liberado');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function getResumen(req, res) {
  return ok(res, resumen());
}

module.exports = {
  getDisponibilidad,
  getReglas,
  getCondiciones,
  postReserva,
  getReservas,
  patchAvanzar,
  patchCancelar,
  patchLiberar,
  getResumen,
};
