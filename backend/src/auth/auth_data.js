const crypto = require('node:crypto');

// Roles del panel administrativo (propuesta, sección 4.5.6).
const ROLES = {
  administrador: 'Administrador',
  circulacion: 'Personal de circulación',
  tesis: 'Personal de tesis',
  consulta: 'Consulta',
};

// Cuentas de prueba para la propuesta. Antes de usar el sistema en serio hay que cambiar estas
// claves (se pueden definir con variables de entorno) y guardar las cuentas en una base de datos.
const CUENTAS_DE_PRUEBA = [
  { usuario: 'admin', nombre: 'Administración', rol: 'administrador', clave: process.env.CLAVE_ADMIN || 'admin2026' },
  { usuario: 'circulacion', nombre: 'Circulación y Préstamo', rol: 'circulacion', clave: process.env.CLAVE_CIRCULACION || 'circulacion2026' },
  { usuario: 'tesis', nombre: 'Tesis', rol: 'tesis', clave: process.env.CLAVE_TESIS || 'tesis2026' },
  { usuario: 'consulta', nombre: 'Consulta de estadísticas', rol: 'consulta', clave: process.env.CLAVE_CONSULTA || 'consulta2026' },
];

const HORAS_DE_SESION = 8;
const MAXIMO_DE_INTENTOS = 5;
const MINUTOS_DE_BLOQUEO = 5;

function cifrar(clave, sal) {
  return crypto.scryptSync(clave, sal, 32);
}

// Las claves no se guardan tal cual: solo su versión cifrada con una sal propia de cada cuenta.
const cuentas = CUENTAS_DE_PRUEBA.map(({ clave, ...cuenta }) => {
  const sal = crypto.randomBytes(16);
  return { ...cuenta, sal, hash: cifrar(clave, sal) };
});

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

module.exports = { ROLES, iniciarSesion, sesionDeToken, cerrarSesion };
