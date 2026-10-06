const crypto = require('node:crypto');

// Sin 0, O, 1, I ni L para que el código se pueda leer y dictar sin confundirse.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// Código corto de confirmación que acompaña a cada reserva o solicitud (propuesta, sección 4.5.5).
function generarCodigoConfirmacion(largo = 6) {
  let codigo = '';
  for (let i = 0; i < largo; i += 1) {
    codigo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }
  return codigo;
}

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function correoValido(correo) {
  return typeof correo === 'string' && correo.length <= 120 && CORREO_VALIDO.test(correo.trim());
}

module.exports = { generarCodigoConfirmacion, correoValido };
