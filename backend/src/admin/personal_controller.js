const cuentasData = require('../auth/cuentas_data');
const { cerrarSesionesDe, actualizarNombreEnSesiones } = require('../auth/auth_data');
const { tokenDe } = require('../auth/auth_middleware');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

// Cuentas del personal (solo el administrador): crear, cambiar rol o estado y restablecer claves.

const NOMBRE_DEL_CAMPO = { nombre: 'nombre', rol: 'rol', activa: 'estado' };

function textoDelValor(campo, valor) {
  if (campo === 'activa') return valor ? 'activa' : 'desactivada';
  if (campo === 'rol') return cuentasData.ROLES[valor];
  return valor;
}

function describirCambios(cambios) {
  return Object.entries(cambios)
    .map(([campo, [antes, despues]]) => `${NOMBRE_DEL_CAMPO[campo]}: ${textoDelValor(campo, antes)} → ${textoDelValor(campo, despues)}`)
    .join(', ');
}

function getPersonal(req, res) {
  return ok(res, cuentasData.listar());
}

function postPersonal(req, res) {
  try {
    const cuenta = cuentasData.crear(req.body);
    registrar(req.sesion, 'personal.creada', `${cuenta.usuario} (${cuenta.rolNombre})`);
    return ok(res, cuenta, 'Cuenta creada', 201);
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function patchPersonal(req, res) {
  try {
    const { nombre, rol, activa } = req.body;
    const resultado = cuentasData.actualizar(req.params.usuario, { nombre, rol, activa }, req.sesion.usuario);
    if (!resultado) return notFound(res, 'Cuenta no encontrada');

    const { cuenta, cambios } = resultado;
    if (cambios.rol || cambios.activa) {
      cerrarSesionesDe(cuenta.usuario); // el cambio de rol o de estado rige desde ya: tendrá que entrar otra vez
    } else if (cambios.nombre) {
      actualizarNombreEnSesiones(cuenta.usuario, cuenta.nombre);
    }
    if (Object.keys(cambios).length > 0) {
      registrar(req.sesion, 'personal.actualizada', `${cuenta.usuario}: ${describirCambios(cambios)}`);
    }
    return ok(res, cuenta, 'Cuenta actualizada');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function postClavePersonal(req, res) {
  try {
    const cuenta = cuentasData.cambiarClave(req.params.usuario, req.body.clave);
    if (!cuenta) return notFound(res, 'Cuenta no encontrada');

    const esLaPropia = cuenta.usuario === req.sesion.usuario;
    cerrarSesionesDe(cuenta.usuario, { excepto: esLaPropia ? tokenDe(req) : undefined });
    registrar(req.sesion, 'personal.clave', `Restableció la clave de ${cuenta.usuario}`);
    return ok(res, { restablecida: true }, 'Clave restablecida');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

module.exports = { getPersonal, postPersonal, patchPersonal, postClavePersonal };
