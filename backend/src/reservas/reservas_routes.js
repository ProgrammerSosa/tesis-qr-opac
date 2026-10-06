const express = require('express');
const {
  getDisponibilidad,
  getReglas,
  postReserva,
  getReservas,
  patchAvanzar,
  patchCancelar,
  getResumen,
} = require('./reservas_controller');

const router = express.Router();

router.get('/resumen', getResumen);
router.get('/reglas', getReglas);
router.get('/', getReservas);
router.get('/:tipo/disponibilidad', getDisponibilidad);
router.post('/:tipo', postReserva);
router.patch('/item/:id/avanzar', patchAvanzar);
router.patch('/item/:id/cancelar', patchCancelar);

module.exports = router;
