const express = require('express');
const { postLogin, postLogout, getMe } = require('./auth_controller');
const { autenticar } = require('./auth_middleware');

const router = express.Router();

router.post('/login', postLogin);
router.post('/logout', autenticar, postLogout);
router.get('/me', autenticar, getMe);

module.exports = router;
