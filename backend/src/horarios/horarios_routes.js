const express = require('express');
const horarios = require('./horarios_data');
const { esFechaISO, fechaLocal } = require('../../utils/fechas');
const { ok, fail } = require('../../utils/httpResponse');

const router = express.Router();

// Si hay servicio un día y a qué horas se puede reservar (la pantalla de reservas lo usa para avisar de los cierres).
// Es información pública: no pide sesión.
router.get('/horarios/dia', (req, res) => {
  const { fecha } = req.query;
  if (!esFechaISO(fecha)) {
    return fail(res, 'Indica una fecha válida');
  }
  return ok(res, horarios.resumenDelDia(fecha));
});

// La semana completa con las horas de reserva de cada día y los próximos cierres (el inicio del sitio la muestra).
router.get('/horarios/semana', (req, res) => ok(res, horarios.resumenDeLaSemana(fechaLocal())));

module.exports = router;
