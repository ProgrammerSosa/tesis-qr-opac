const express = require('express');
const { postEvento } = require('./eventos_controller');

const router = express.Router();

router.post('/', postEvento);

module.exports = router;
