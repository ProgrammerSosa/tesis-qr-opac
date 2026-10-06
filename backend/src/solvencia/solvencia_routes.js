const express = require('express');
const { getMotivos, postSolicitud, getSolicitudes, patchAvanzar, patchRechazar, getResumen } = require('./solvencia_controller');

const router = express.Router();

router.get('/resumen', getResumen);
router.get('/motivos', getMotivos);
router.get('/', getSolicitudes);
router.post('/', postSolicitud);
router.patch('/:id/avanzar', patchAvanzar);
router.patch('/:id/rechazar', patchRechazar);

module.exports = router;
