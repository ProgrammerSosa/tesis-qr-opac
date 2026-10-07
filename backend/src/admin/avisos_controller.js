const avisos = require('../avisos/avisos_data');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

// Avisos para el público (administrador y circulación).

function getAvisos(req, res) {
  return ok(res, avisos.listarTodos());
}

function postAviso(req, res) {
  try {
    const { titulo, texto, tipo, vigenteHasta } = req.body;
    const aviso = avisos.crear({ titulo, texto, tipo, vigenteHasta }, req.sesion);
    registrar(req.sesion, 'aviso.creado', `${aviso.id}: ${aviso.titulo}`);
    return ok(res, aviso, 'Aviso publicado', 201);
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function patchAviso(req, res) {
  try {
    const { titulo, texto, tipo, vigenteHasta, activo } = req.body;
    const aviso = avisos.actualizar(req.params.id, { titulo, texto, tipo, vigenteHasta, activo });
    if (!aviso) return notFound(res, 'Aviso no encontrado');
    registrar(req.sesion, 'aviso.actualizado', `${aviso.id}: ${aviso.titulo}${aviso.activo ? '' : ' (oculto)'}`);
    return ok(res, aviso, 'Aviso actualizado');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function deleteAviso(req, res) {
  const aviso = avisos.eliminar(req.params.id);
  if (!aviso) return notFound(res, 'Aviso no encontrado');
  registrar(req.sesion, 'aviso.eliminado', `${aviso.id}: ${aviso.titulo}`);
  return ok(res, { eliminado: true });
}

module.exports = { getAvisos, postAviso, patchAviso, deleteAviso };
