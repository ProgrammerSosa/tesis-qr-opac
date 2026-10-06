const express = require('express');
const { postEnviar } = require('./comprobantes_controller');

const router = express.Router();

router.post('/enviar', postEnviar);

module.exports = router;
