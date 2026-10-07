const crypto = require('node:crypto');
const cuentasData = require('./cuentas_data');

const HORAS_DE_SESION = 8;
const MAXIMO_DE_INTENTOS = 5;
const MINUTOS_DE_BLOQUEO = 5;

const sesiones = new Map(); // token -> { usuario, nombre, rol, expiraEn }
const intentos = new Map(); // usuario -> { cantidad, desde }

function bloqueado(usuario) {
  const registro = intentos.get(usuario);
  if (!registro) return false;
  if (Date.now() - registro.desde > MINUTOS_DE_BLOQUEO * 60 * 1000) {
    intentos.delete(usuario);
    return false;
  }
  return registro.cantidad >= MAXIMO_DE_INTENTOS;
}

function anotarFallo(usuario) {
  // Quien prueba muchos usuarios inventados no debe llenar la memoria: se descartan los registros ya vencidos.
  if (intentos.size > 500) {
    const limite = Date.now() - MINUTOS_DE_BLOQUEO * 60 * 1000;
    intentos.forEach((registro, clave) => {
      if (registro.desde < limite) intentos.delete(clave);
    });
  }
  const registro = intentos.get(usuario) || { cantidad: 0, desde: Date.now() };
  registro.cantidad += 1;
  intentos.set(usuario, registro);
}

// Comprueba usuario y clave aplicando el bloqueo por intentos fallidos. Devuelve { cuenta } si son correctos,
// { bloqueado: true } si hubo demasiados intentos, o {} si no coinciden.
function comprobarClave(usuario, clave) {
  const nombre = String(usuario || '').trim().toLowerCase();
  if (bloqueado(nombre)) return { bloqueado: true };

  const cuenta = cuentasData.verificar(nombre, clave);
  if (!cuenta) {
    anotarFallo(nombre);
    return {};
  }
  intentos.delete(nombre);
  return { cuenta };
}

// Devuelve { sesion } si las credenciales son correctas, { bloqueado: true } si hubo demasiados
// intentos fallidos, o {} si no coinciden (o si la cuenta está desactivada).
function iniciarSesion(usuario, clave) {
  const { cuenta, bloqueado: enBloqueo } = comprobarClave(usuario, clave);
  if (enBloqueo) return { bloqueado: true };
  if (!cuenta) return {};

  cuentasData.registrarAcceso(cuenta.usuario);
  const token = crypto.randomBytes(32).toString('hex');
  const datos = { usuario: cuenta.usuario, nombre: cuenta.nombre, rol: cuenta.rol };
  sesiones.set(token, { ...datos, expiraEn: Date.now() + HORAS_DE_SESION * 60 * 60 * 1000 });
  return { sesion: { token, ...datos, rolNombre: cuentasData.ROLES[cuenta.rol] } };
}

function sesionDeToken(token) {
  const sesion = sesiones.get(token);
  if (!sesion) return null;
  if (sesion.expiraEn < Date.now()) {
    sesiones.delete(token);
    return null;
  }
  return sesion;
}

function cerrarSesion(token) {
  sesiones.delete(token);
}

// Cierra todas las sesiones de una cuenta (por ejemplo, al desactivarla o cambiarle el rol o la clave),
// menos la del token indicado, para no sacar a quien está haciendo el cambio sobre su propia cuenta.
function cerrarSesionesDe(usuario, { excepto } = {}) {
  sesiones.forEach((sesion, token) => {
    if (sesion.usuario === usuario && token !== excepto) sesiones.delete(token);
  });
}

function actualizarNombreEnSesiones(usuario, nombre) {
  sesiones.forEach((sesion) => {
    if (sesion.usuario === usuario) sesion.nombre = nombre;
  });
}

module.exports = {
  comprobarClave,
  iniciarSesion,
  sesionDeToken,
  cerrarSesion,
  cerrarSesionesDe,
  actualizarNombreEnSesiones,
};
