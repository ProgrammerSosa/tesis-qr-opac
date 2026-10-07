const express = require('express');
const { getReglas, postTramite, getTramites, patchEstado } = require('./tramites_controller');
const { autenticar, requiereRol } = require('../auth/auth_middleware');

const router = express.Router();

const personal = [autenticar, requiereRol('administrador', 'circulacion', 'tesis')];

// Públicas: cualquier persona puede enviar una solicitud.
router.get('/reglas', getReglas);
router.post('/:tipo', postTramite);

// Solo personal autorizado (cada rol ve y atiende las suyas).
router.get('/', ...personal, getTramites);
router.patch('/:id/estado', ...personal, patchEstado);

module.exports = router;
