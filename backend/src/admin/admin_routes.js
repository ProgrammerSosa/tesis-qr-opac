const express = require('express');
const { getResumen } = require('./admin_controller');

const router = express.Router();

router.get('/resumen', getResumen);

module.exports = router;
