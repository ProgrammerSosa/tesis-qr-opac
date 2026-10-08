const express = require('express');
const horarios = require('./horarios_data');
const { esFechaISO } = require('../../utils/fechas');
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

module.exports = router;
