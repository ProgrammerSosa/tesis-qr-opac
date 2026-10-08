const express = require('express');
const horarios = require('./horarios_data');
const { esFechaISO, fechaLocal, sumarDias } = require('../../utils/fechas');
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

// Cómo está cada día de un rango (cerrado o no y cuántas horas se pueden reservar): el calendario de la pantalla de reservas lo usa
// para marcar los días de cierre antes de que alguien los elija. Como máximo 62 días por consulta.
const MAXIMO_DE_DIAS = 62;
router.get('/horarios/dias', (req, res) => {
  const { desde, hasta } = req.query;
  if (!esFechaISO(desde) || !esFechaISO(hasta) || hasta < desde) {
    return fail(res, 'Indica un rango de fechas válido (desde y hasta)');
  }
  const dias = [];
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
    if (dias.length >= MAXIMO_DE_DIAS) {
      return fail(res, `Pide como máximo ${MAXIMO_DE_DIAS} días por vez`);
    }
    const dia = horarios.resumenDelDia(fecha);
    dias.push({ fecha, cerrado: dia.cerrado, motivo: dia.motivo, horas: dia.franjas.length });
  }
  return ok(res, dias);
});

// La semana completa con las horas de reserva de cada día y los próximos cierres (el inicio del sitio la muestra).
router.get('/horarios/semana', (req, res) => ok(res, horarios.resumenDeLaSemana(fechaLocal())));

module.exports = router;
