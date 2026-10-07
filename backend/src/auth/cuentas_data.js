const crypto = require('node:crypto');
const { rechazo } = require('../../utils/errores');

// Roles del panel del personal (propuesta, sección 4.5.6).
const ROLES = {
  administrador: 'Administrador',
  circulacion: 'Personal de circulación',
  tesis: 'Personal de tesis',
  consulta: 'Consulta',
};

// Cuentas con las que arranca el sistema; después el administrador puede crear más, cambiarlas o desactivarlas.
// Aquí solo se definen el usuario, el nombre y el rol: las claves nunca se escriben en el código (el repositorio es
// público). Cada una viene de una variable de entorno, normalmente desde backend/.env, que no se sube a git (hay un
// modelo en backend/.env.example). Una cuenta sin clave definida recibe una clave temporal al azar, que vale solo
// mientras el servidor siga encendido y se muestra únicamente en la consola del servidor.
// Los datos viven en memoria: antes de usar el sistema en serio, las cuentas deberían guardarse en una base de datos.
const CUENTAS_INICIALES = [
  { usuario: 'admin', nombre: 'Administración', rol: 'administrador', variable: 'CLAVE_ADMIN' },
  { usuario: 'circulacion', nombre: 'Circulación y Préstamo', rol: 'circulacion', variable: 'CLAVE_CIRCULACION' },
  { usuario: 'tesis', nombre: 'Tesis', rol: 'tesis', variable: 'CLAVE_TESIS' },
  { usuario: 'consulta', nombre: 'Consulta de estadísticas', rol: 'consulta', variable: 'CLAVE_CONSULTA' },
];

const LARGO_MINIMO_CLAVE = 8;
const LARGO_MAXIMO_CLAVE = 72;
const FORMATO_DE_USUARIO = /^[a-z0-9][a-z0-9._-]{2,19}$/;

function cifrar(clave, sal) {
  return crypto.scryptSync(clave, sal, 32);
}

// Letras y números sin los que se confunden al leerlos (0/o, 1/l), para que una clave temporal sea fácil de copiar.
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';

function claveAlAzar() {
  return Array.from({ length: 12 }, () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join('');
}

// Para que comprobar un usuario que no existe tarde lo mismo que comprobar uno que sí existe.
const SAL_FALSA = crypto.randomBytes(16);
const HASH_FALSO = cifrar('sin-cuenta', SAL_FALSA);

const clavesTemporales = []; // { usuario, variable, clave } de las cuentas que arrancaron sin clave definida

// Las claves no se guardan tal cual: solo su versión cifrada con una sal propia de cada cuenta.
function nuevaCuenta({ usuario, nombre, rol, clave }) {
  const sal = crypto.randomBytes(16);
  return { usuario, nombre, rol, activa: true, creadaEn: new Date().toISOString(), ultimoAcceso: null, sal, hash: cifrar(clave, sal) };
}

const cuentas = CUENTAS_INICIALES.map(({ variable, ...cuenta }) => {
  let clave = process.env[variable];
  if (!clave) {
    clave = claveAlAzar();
    clavesTemporales.push({ usuario: cuenta.usuario, variable, clave });
  }
  return nuevaCuenta({ ...cuenta, clave });
});

// Entrega, una sola vez, las claves temporales para mostrarlas en la consola, y las olvida.
function retirarClavesTemporales() {
  return clavesTemporales.splice(0);
}

function buscar(usuario) {
  return cuentas.find((c) => c.usuario === usuario) || null;
}

// Lo que se puede mostrar de una cuenta: nunca la sal ni la clave cifrada.
function vista(cuenta) {
  const { sal, hash, ...publica } = cuenta;
  return { ...publica, rolNombre: ROLES[cuenta.rol] };
}

function listar() {
  return cuentas.map(vista);
}

function obtener(usuario) {
  const cuenta = buscar(usuario);
  return cuenta ? vista(cuenta) : null;
}

// Devuelve la cuenta si el usuario existe, está activa y la clave coincide; si no, null.
function verificar(usuario, clave) {
  const texto = typeof clave === 'string' ? clave : '';
  if (texto.length > 256) return null; // evita cifrar textos enormes
  const cuenta = buscar(usuario);
  const coincide = crypto.timingSafeEqual(cuenta ? cuenta.hash : HASH_FALSO, cifrar(texto, cuenta ? cuenta.sal : SAL_FALSA));
  return cuenta && cuenta.activa && coincide ? cuenta : null;
}

function registrarAcceso(usuario) {
  const cuenta = buscar(usuario);
  if (cuenta) cuenta.ultimoAcceso = new Date().toISOString();
}

function validarNombre(nombre) {
  const limpio = String(nombre ?? '').trim().replace(/\s+/g, ' ');
  if (limpio.length < 2 || limpio.length > 60) {
    throw rechazo('El nombre debe tener de 2 a 60 caracteres');
  }
  return limpio;
}

function validarRol(rol) {
  if (typeof rol !== 'string' || !Object.hasOwn(ROLES, rol)) {
    throw rechazo('Elige un rol válido');
  }
  return rol;
}

function validarClave(clave, usuario) {
  const texto = typeof clave === 'string' ? clave : '';
  if (texto.length < LARGO_MINIMO_CLAVE) {
    throw rechazo(`La clave debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres`);
  }
  if (texto.length > LARGO_MAXIMO_CLAVE) {
    throw rechazo(`La clave no puede pasar de ${LARGO_MAXIMO_CLAVE} caracteres`);
  }
  if (texto.toLowerCase() === usuario) {
    throw rechazo('La clave no puede ser igual al usuario');
  }
  return texto;
}

function crear({ usuario, nombre, rol, clave } = {}) {
  const id = String(usuario ?? '').trim().toLowerCase();
  if (!FORMATO_DE_USUARIO.test(id)) {
    throw rechazo('El usuario debe tener de 3 a 20 caracteres: letras, números, punto, guion o guion bajo');
  }
  if (buscar(id)) {
    throw rechazo('Ya existe una cuenta con ese usuario', 409);
  }
  const cuenta = nuevaCuenta({ usuario: id, nombre: validarNombre(nombre), rol: validarRol(rol), clave: validarClave(clave, id) });
  cuentas.push(cuenta);
  return vista(cuenta);
}

// Cambia el nombre, el rol o el estado (activa o desactivada) de una cuenta. Devuelve null si no existe, o la
// cuenta con los cambios hechos ({ campo: [antes, después] }). `actor` es quien hace el cambio: nadie puede
// quitarse a sí mismo el rol de administrador ni desactivarse, y siempre debe quedar un administrador activo.
function actualizar(usuario, { nombre, rol, activa } = {}, actor) {
  const cuenta = buscar(usuario);
  if (!cuenta) return null;

  const nuevoNombre = nombre === undefined ? cuenta.nombre : validarNombre(nombre);
  const nuevoRol = rol === undefined ? cuenta.rol : validarRol(rol);
  if (activa !== undefined && typeof activa !== 'boolean') {
    throw rechazo('Indica si la cuenta queda activa o no');
  }
  const nuevaActiva = activa === undefined ? cuenta.activa : activa;

  const cambiaElAcceso = nuevoRol !== cuenta.rol || nuevaActiva !== cuenta.activa;
  if (cambiaElAcceso && usuario === actor) {
    throw rechazo('No puedes cambiar tu propio rol ni desactivar tu propia cuenta', 409);
  }
  const otrosAdministradores = cuentas.filter((c) => c !== cuenta && c.rol === 'administrador' && c.activa).length;
  if (cambiaElAcceso && otrosAdministradores === 0 && !(nuevoRol === 'administrador' && nuevaActiva)) {
    throw rechazo('Debe quedar al menos un administrador activo', 409);
  }

  const cambios = {};
  if (nuevoNombre !== cuenta.nombre) cambios.nombre = [cuenta.nombre, nuevoNombre];
  if (nuevoRol !== cuenta.rol) cambios.rol = [cuenta.rol, nuevoRol];
  if (nuevaActiva !== cuenta.activa) cambios.activa = [cuenta.activa, nuevaActiva];

  cuenta.nombre = nuevoNombre;
  cuenta.rol = nuevoRol;
  cuenta.activa = nuevaActiva;
  return { cuenta: vista(cuenta), cambios };
}

// Pone una clave nueva. Devuelve null si la cuenta no existe.
function cambiarClave(usuario, clave) {
  const cuenta = buscar(usuario);
  if (!cuenta) return null;
  const nueva = validarClave(clave, usuario);
  cuenta.sal = crypto.randomBytes(16);
  cuenta.hash = cifrar(nueva, cuenta.sal);
  return vista(cuenta);
}

module.exports = {
  ROLES,
  retirarClavesTemporales,
  listar,
  obtener,
  verificar,
  registrarAcceso,
  crear,
  actualizar,
  cambiarClave,
};
