const horarios = require('../horarios/horarios_data');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

// Horarios de reserva y días de cierre (solo el administrador).

function getHorarios(req, res) {
  return ok(res, horarios.obtener());
}

function putHorarios(req, res) {
  try {
    const nuevos = horarios.actualizar({ reservas: req.body?.reservas });
    registrar(req.sesion, 'horarios.actualizados', 'Cambió los horarios de reserva');
    return ok(res, nuevos, 'Horarios guardados');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function postCierre(req, res) {
  try {
    const cierre = horarios.agregarCierre(req.body);
    const rango = cierre.desde === cierre.hasta ? cierre.desde : `${cierre.desde} al ${cierre.hasta}`;
    registrar(req.sesion, 'horarios.cierre_agregado', `${rango}: ${cierre.motivo}`);
    return ok(res, cierre, 'Cierre registrado', 201);
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function deleteCierre(req, res) {
  const cierre = horarios.quitarCierre(req.params.id);
  if (!cierre) return notFound(res, 'Cierre no encontrado');
  registrar(req.sesion, 'horarios.cierre_quitado', `${cierre.desde} al ${cierre.hasta}: ${cierre.motivo}`);
  return ok(res, { quitado: true });
}

module.exports = { getHorarios, putHorarios, postCierre, deleteCierre };
