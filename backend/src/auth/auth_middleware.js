const { sesionDeToken } = require('./auth_data');
const { fail } = require('../../utils/httpResponse');

function tokenDe(req) {
  const cabecera = req.get('Authorization') || '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
}

// Exige haber iniciado sesión; deja los datos de la sesión en `req.sesion`.
function autenticar(req, res, next) {
  const sesion = sesionDeToken(tokenDe(req));
  if (!sesion) {
    return fail(res, 'Debes iniciar sesión para entrar a esta sección', 401);
  }
  req.sesion = sesion;
  return next();
}

// Exige además que el rol de la sesión esté entre los permitidos.
function requiereRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.sesion.rol)) {
      return fail(res, 'Tu rol no tiene permiso para esta sección', 403);
    }
    return next();
  };
}

module.exports = { tokenDe, autenticar, requiereRol };
