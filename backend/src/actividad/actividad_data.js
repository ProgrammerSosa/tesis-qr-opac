const almacen = require('../../utils/almacen');

// Registro de lo que hace el personal en el panel (quién, cuándo y qué), para que el administrador pueda revisarlo
// (propuesta, sección 4.5.6: evitar modificaciones accidentales). Se guarda en el almacén de datos y conserva solo lo último.
const MAXIMO_DE_REGISTROS = 1000;

const estado = almacen.cargar('actividad', { registros: [], contador: 0 });
const registros = estado.registros; // el más reciente primero

// `sesion` es la sesión de quien actúa (la deja `autenticar` en `req.sesion`).
// `accion` es un código con forma "categoria.hecho", por ejemplo "reserva.cancelada".
function registrar(sesion, accion, detalle = '') {
  estado.contador += 1;
  registros.unshift({
    id: estado.contador,
    fecha: new Date().toISOString(),
    usuario: sesion?.usuario ?? 'sistema',
    nombre: sesion?.nombre ?? null,
    rol: sesion?.rol ?? null,
    accion,
    detalle,
  });
  if (registros.length > MAXIMO_DE_REGISTROS) registros.length = MAXIMO_DE_REGISTROS;
  almacen.guardar('actividad', estado);
}

// Los más recientes primero. Se puede filtrar por usuario y por categoría (la parte del código antes del punto).
function listar({ usuario, categoria, limite = 200 } = {}) {
  const tope = Math.min(Math.max(Number(limite) || 200, 1), MAXIMO_DE_REGISTROS);
  return registros
    .filter((r) => (!usuario || r.usuario === usuario) && (!categoria || r.accion.split('.')[0] === categoria))
    .slice(0, tope);
}

function usuariosConActividad() {
  return [...new Set(registros.map((r) => r.usuario))].sort();
}

module.exports = { registrar, listar, usuariosConActividad };
