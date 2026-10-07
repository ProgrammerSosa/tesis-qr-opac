const configuracion = require('../configuracion/configuracion_data');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail } = require('../../utils/httpResponse');

// Ajustes generales (solo el administrador).

function getConfiguracion(req, res) {
  return ok(res, configuracion.obtener());
}

function patchConfiguracion(req, res) {
  try {
    const { configuracion: nueva, cambios } = configuracion.actualizar(req.body, req.sesion);
    if (cambios.length > 0) {
      registrar(req.sesion, 'configuracion.cambiada', cambios.join('; '));
    }
    return ok(res, nueva, cambios.length > 0 ? 'Configuración guardada' : 'No había cambios que guardar');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

module.exports = { getConfiguracion, patchConfiguracion };
