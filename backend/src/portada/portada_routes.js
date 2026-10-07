const express = require('express');
const horarios = require('../horarios/horarios_data');
const avisos = require('../avisos/avisos_data');
const { esFechaISO } = require('../../utils/fechas');
const { ok, fail } = require('../../utils/httpResponse');

const router = express.Router();

// Lo que se muestra en el inicio y en el pie de todas las páginas: los horarios, si la biblioteca está abierta ahora,
// los próximos cierres y los avisos vigentes. Es información pública, así que no pide sesión.
router.get('/portada', (req, res) => {
  res.set('Cache-Control', 'public, max-age=30');
  return ok(res, {
    horario: { semana: horarios.semana(), estado: horarios.estadoAhora(), proximosCierres: horarios.proximosCierres() },
    avisos: avisos.listarVigentes(),
  });
});

// Si hay atención un día y a qué horas se puede reservar (la pantalla de reservas lo usa para avisar de los cierres).
router.get('/horarios/dia', (req, res) => {
  const { fecha } = req.query;
  if (!esFechaISO(fecha)) {
    return fail(res, 'Indica una fecha válida');
  }
  return ok(res, horarios.resumenDelDia(fecha));
});

module.exports = router;
