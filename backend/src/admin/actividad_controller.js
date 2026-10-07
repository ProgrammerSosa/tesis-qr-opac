const { listar, usuariosConActividad } = require('../actividad/actividad_data');
const { ok } = require('../../utils/httpResponse');

// Registro de lo que hace el personal (solo el administrador).
function getActividad(req, res) {
  const { usuario, categoria, limite } = req.query;
  return ok(res, { registros: listar({ usuario, categoria, limite }), usuarios: usuariosConActividad() });
}

module.exports = { getActividad };
