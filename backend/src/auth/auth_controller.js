const { ROLES, iniciarSesion, cerrarSesion } = require('./auth_data');
const { tokenDe } = require('./auth_middleware');
const { ok, fail } = require('../../utils/httpResponse');

function postLogin(req, res) {
  const { usuario, clave } = req.body;
  if (!usuario || !clave) {
    return fail(res, 'Escribe tu usuario y tu clave');
  }
  const { sesion, bloqueado } = iniciarSesion(usuario, clave);
  if (bloqueado) {
    return fail(res, 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo', 429);
  }
  if (!sesion) {
    return fail(res, 'Usuario o clave incorrectos', 401);
  }
  return ok(res, sesion, 'Sesión iniciada');
}

function postLogout(req, res) {
  cerrarSesion(tokenDe(req));
  return ok(res, { cerrada: true });
}

function getMe(req, res) {
  const { usuario, nombre, rol } = req.sesion;
  return ok(res, { usuario, nombre, rol, rolNombre: ROLES[rol] });
}

module.exports = { postLogin, postLogout, getMe };
