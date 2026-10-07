const crypto = require('node:crypto');

// Roles del panel administrativo (propuesta, sección 4.5.6).
const ROLES = {
  administrador: 'Administrador',
  circulacion: 'Personal de circulación',
  tesis: 'Personal de tesis',
  consulta: 'Consulta',
};

// Cuentas del panel. Aquí solo se definen el usuario, el nombre y el rol: las claves nunca se escriben en el código
// (el repositorio es público). Cada una viene de una variable de entorno, normalmente desde backend/.env, que no se
// sube a git (hay un modelo en backend/.env.example). Una cuenta sin clave definida recibe una clave temporal al azar,
// que vale solo mientras el servidor siga encendido y se muestra únicamente en la consola del servidor.
// Antes de usar el sistema en serio, además, las cuentas deberían guardarse en una base de datos.
const CUENTAS = [
  { usuario: 'admin', nombre: 'Administración', rol: 'administrador', variable: 'CLAVE_ADMIN' },
  { usuario: 'circulacion', nombre: 'Circulación y Préstamo', rol: 'circulacion', variable: 'CLAVE_CIRCULACION' },
  { usuario: 'tesis', nombre: 'Tesis', rol: 'tesis', variable: 'CLAVE_TESIS' },
  { usuario: 'consulta', nombre: 'Consulta de estadísticas', rol: 'consulta', variable: 'CLAVE_CONSULTA' },
];

const HORAS_DE_SESION = 8;
const MAXIMO_DE_INTENTOS = 5;
const MINUTOS_DE_BLOQUEO = 5;

function cifrar(clave, sal) {
  return crypto.scryptSync(clave, sal, 32);
}

// Letras y números sin los que se confunden al leerlos (0/o, 1/l), para que una clave temporal sea fácil de copiar.
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';

function claveAlAzar() {
  return Array.from({ length: 12 }, () => ALFABETO[crypto.randomInt(ALFABETO.length)]).join('');
}

const clavesTemporales = []; // { usuario, variable, clave } de las cuentas que arrancaron sin clave definida

// Las claves no se guardan tal cual: solo su versión cifrada con una sal propia de cada cuenta.
const cuentas = CUENTAS.map(({ variable, ...cuenta }) => {
  let clave = process.env[variable];
  if (!clave) {
    clave = claveAlAzar();
    clavesTemporales.push({ usuario: cuenta.usuario, variable, clave });
  }
  const sal = crypto.randomBytes(16);
  return { ...cuenta, sal, hash: cifrar(clave, sal) };
});

// Entrega, una sola vez, las claves temporales para mostrarlas en la consola, y las olvida.
function retirarClavesTemporales() {
  return clavesTemporales.splice(0);
}

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
  const registro = intentos.get(usuario) || { cantidad: 0, desde: Date.now() };
  registro.cantidad += 1;
  intentos.set(usuario, registro);
}

// Devuelve { sesion } si las credenciales son correctas, { bloqueado: true } si hubo demasiados
// intentos fallidos, o {} si no coinciden.
function iniciarSesion(usuario, clave) {
  const nombre = String(usuario || '').trim().toLowerCase();
  if (bloqueado(nombre)) return { bloqueado: true };

  const cuenta = cuentas.find((c) => c.usuario === nombre);
  const hash = cuenta ? cuenta.hash : cifrar('sin-cuenta', Buffer.alloc(16));
  const coincide = crypto.timingSafeEqual(hash, cifrar(String(clave || ''), cuenta ? cuenta.sal : Buffer.alloc(16)));
  if (!cuenta || !coincide) {
    anotarFallo(nombre);
    return {};
  }

  intentos.delete(nombre);
  const token = crypto.randomBytes(32).toString('hex');
  const datos = { usuario: cuenta.usuario, nombre: cuenta.nombre, rol: cuenta.rol };
  sesiones.set(token, { ...datos, expiraEn: Date.now() + HORAS_DE_SESION * 60 * 60 * 1000 });
  return { sesion: { token, ...datos, rolNombre: ROLES[cuenta.rol] } };
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

module.exports = { ROLES, retirarClavesTemporales, iniciarSesion, sesionDeToken, cerrarSesion };
