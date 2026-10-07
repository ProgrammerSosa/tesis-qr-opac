const express = require('express');
const {
  getResumen,
  getUsuarios,
  getTesis,
  patchDocumento,
  patchQr,
  postVerificarQr,
  getEstadisticas,
} = require('./admin_controller');
const { getPersonal, postPersonal, patchPersonal, postClavePersonal } = require('./personal_controller');
const { getConfiguracion, patchConfiguracion } = require('./configuracion_controller');
const { getActividad } = require('./actividad_controller');
const { autenticar, requiereRol } = require('../auth/auth_middleware');

const router = express.Router();

// Qué rol entra a qué sección (propuesta, sección 4.5.6).
const circulacion = [autenticar, requiereRol('administrador', 'circulacion')];
const tesis = [autenticar, requiereRol('administrador', 'tesis')];
const estadisticas = [autenticar, requiereRol('administrador', 'consulta')];
const soloAdministrador = [autenticar, requiereRol('administrador')];

router.get('/resumen', autenticar, getResumen);
router.get('/usuarios', ...circulacion, getUsuarios);
router.get('/tesis', ...tesis, getTesis);
router.patch('/tesis/:id/documento', ...tesis, patchDocumento);
router.get('/qr', ...tesis, getTesis);
router.patch('/qr/:id', ...tesis, patchQr);
router.post('/qr/:id/verificar', ...tesis, postVerificarQr);
router.get('/estadisticas', ...estadisticas, getEstadisticas);

// Administración: cuentas del personal, configuración general y registro de actividad.
router.get('/personal', ...soloAdministrador, getPersonal);
router.post('/personal', ...soloAdministrador, postPersonal);
router.patch('/personal/:usuario', ...soloAdministrador, patchPersonal);
router.post('/personal/:usuario/clave', ...soloAdministrador, postClavePersonal);
router.get('/configuracion', ...soloAdministrador, getConfiguracion);
router.patch('/configuracion', ...soloAdministrador, patchConfiguracion);
router.get('/actividad', ...soloAdministrador, getActividad);

module.exports = router;
