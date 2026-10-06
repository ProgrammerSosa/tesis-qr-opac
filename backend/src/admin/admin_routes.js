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
const { autenticar, requiereRol } = require('../auth/auth_middleware');

const router = express.Router();

// Qué rol entra a qué sección (propuesta, sección 4.5.6).
const circulacion = [autenticar, requiereRol('administrador', 'circulacion')];
const tesis = [autenticar, requiereRol('administrador', 'tesis')];
const estadisticas = [autenticar, requiereRol('administrador', 'consulta')];

router.get('/resumen', autenticar, getResumen);
router.get('/usuarios', ...circulacion, getUsuarios);
router.get('/tesis', ...tesis, getTesis);
router.patch('/tesis/:id/documento', ...tesis, patchDocumento);
router.get('/qr', ...tesis, getTesis);
router.patch('/qr/:id', ...tesis, patchQr);
router.post('/qr/:id/verificar', ...tesis, postVerificarQr);
router.get('/estadisticas', ...estadisticas, getEstadisticas);

module.exports = router;
