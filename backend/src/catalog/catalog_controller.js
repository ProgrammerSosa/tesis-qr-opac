const { buscarTesis, obtenerPorId, tesisRelacionadas } = require('./catalog_data');
const { ok, notFound } = require('../../utils/httpResponse');

function listItems(req, res) {
  const { autor, titulo, anio, tema } = req.query;
  const registros = buscarTesis({ autor, titulo, anio, tema });
  return ok(res, registros);
}

function getItem(req, res) {
  const tesis = obtenerPorId(req.params.id);
  if (!tesis) {
    return notFound(res, 'Tesis no encontrada');
  }
  return ok(res, { ...tesis, relacionadas: tesisRelacionadas(tesis) });
}

module.exports = { listItems, getItem };
