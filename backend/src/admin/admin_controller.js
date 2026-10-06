const { TESIS } = require('../catalog/catalog_data');
const reservasData = require('../reservas/reservas_data');
const solvenciaData = require('../solvencia/solvencia_data');
const { ok } = require('../../utils/httpResponse');

function getResumen(req, res) {
  return ok(res, {
    tesis: { total: TESIS.length },
    reservas: reservasData.resumen(),
    solvencia: solvenciaData.resumen(),
  });
}

module.exports = { getResumen };
