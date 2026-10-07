const express = require('express');
const { consultar, cancelarMiReserva } = require('./seguimiento_data');
const { ok, fail } = require('../../utils/httpResponse');

const router = express.Router();

// Públicas: se piden con POST para que el código no quede escrito en la dirección ni en los registros del servidor.
router.post('/', (req, res) => {
  try {
    return ok(res, consultar(req.body?.numero, req.body?.codigo));
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
});

router.post('/cancelar', (req, res) => {
  try {
    return ok(res, cancelarMiReserva(req.body?.numero, req.body?.codigo), 'Reserva cancelada');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
});

module.exports = router;
