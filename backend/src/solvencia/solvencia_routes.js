const express = require('express');
const { getMotivos, getReglas, postSolicitud, getSolicitudes, patchAvanzar, patchRechazar, getResumen } = require('./solvencia_controller');
const { autenticar, requiereRol } = require('../auth/auth_middleware');

const router = express.Router();

// El personal que atiende solicitudes: administración y circulación.
const personal = [autenticar, requiereRol('administrador', 'circulacion')];

// Públicas: cualquier persona puede pedir su solvencia.
router.get('/motivos', getMotivos);
router.get('/reglas', getReglas);
router.post('/', postSolicitud);

// Solo personal autorizado.
router.get('/resumen', ...personal, getResumen);
router.get('/', ...personal, getSolicitudes);
router.patch('/:id/avanzar', ...personal, patchAvanzar);
router.patch('/:id/rechazar', ...personal, patchRechazar);

module.exports = router;
