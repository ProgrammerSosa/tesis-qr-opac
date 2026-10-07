const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');
const { esFechaISO, fechaLocal } = require('../../utils/fechas');

// Avisos para el público: cierres, cambios de horario, novedades. El personal los publica desde el panel y se ven en
// la página de inicio; los "importantes" además salen como una franja en todas las páginas del sitio.
const TIPOS = ['info', 'importante'];
const MAXIMO_DE_AVISOS = 200;

const estado = almacen.cargar('avisos', { avisos: [], contador: 0 });

function guardar() {
  almacen.guardar('avisos', estado);
}

function vigente(aviso, hoy) {
  return aviso.activo && (!aviso.vigenteHasta || aviso.vigenteHasta >= hoy);
}

function validar({ titulo, texto, tipo, vigenteHasta, activo }, existente = null) {
  const resultado = {
    titulo: titulo === undefined ? existente?.titulo : String(titulo).trim(),
    texto: texto === undefined ? existente?.texto : String(texto).trim(),
    tipo: tipo === undefined ? existente?.tipo ?? 'info' : tipo,
    vigenteHasta: vigenteHasta === undefined ? existente?.vigenteHasta ?? null : vigenteHasta || null,
    activo: activo === undefined ? existente?.activo ?? true : activo,
  };
  if (!resultado.titulo || resultado.titulo.length < 3 || resultado.titulo.length > 120) {
    throw rechazo('El título debe tener de 3 a 120 caracteres');
  }
  if (!resultado.texto || resultado.texto.length < 3 || resultado.texto.length > 1000) {
    throw rechazo('El texto del aviso debe tener de 3 a 1000 caracteres');
  }
  if (!TIPOS.includes(resultado.tipo)) {
    throw rechazo('El tipo de aviso no es válido');
  }
  if (resultado.vigenteHasta !== null && !esFechaISO(resultado.vigenteHasta)) {
    throw rechazo('La fecha hasta la que se muestra el aviso no es válida');
  }
  if (typeof resultado.activo !== 'boolean') {
    throw rechazo('Indica si el aviso está activo o no');
  }
  return resultado;
}

function vista(aviso, hoy = fechaLocal()) {
  return { ...aviso, vigente: vigente(aviso, hoy) };
}

// Los que ve el público: activos y que no hayan vencido; los importantes primero y luego los más nuevos.
function listarVigentes(limite = 10) {
  const hoy = fechaLocal();
  return estado.avisos
    .filter((a) => vigente(a, hoy))
    .sort((a, b) => (a.tipo === b.tipo ? b.publicadoEn.localeCompare(a.publicadoEn) : a.tipo === 'importante' ? -1 : 1))
    .slice(0, limite)
    .map(({ id, titulo, texto, tipo, publicadoEn, vigenteHasta }) => ({ id, titulo, texto, tipo, publicadoEn, vigenteHasta }));
}

function listarTodos() {
  const hoy = fechaLocal();
  return estado.avisos.slice().sort((a, b) => b.publicadoEn.localeCompare(a.publicadoEn)).map((a) => vista(a, hoy));
}

function crear(datos, sesion) {
  if (estado.avisos.length >= MAXIMO_DE_AVISOS) {
    throw rechazo('Hay demasiados avisos guardados: elimina los que ya no sirven', 409);
  }
  const limpio = validar(datos);
  estado.contador += 1;
  const aviso = {
    id: `A-${String(estado.contador).padStart(3, '0')}`,
    ...limpio,
    publicadoEn: new Date().toISOString(),
    publicadoPor: sesion?.usuario ?? null,
  };
  estado.avisos.push(aviso);
  guardar();
  return vista(aviso);
}

function actualizar(id, datos) {
  const aviso = estado.avisos.find((a) => a.id === id);
  if (!aviso) return null;
  Object.assign(aviso, validar(datos, aviso));
  guardar();
  return vista(aviso);
}

function eliminar(id) {
  const posicion = estado.avisos.findIndex((a) => a.id === id);
  if (posicion === -1) return null;
  const [quitado] = estado.avisos.splice(posicion, 1);
  guardar();
  return quitado;
}

module.exports = { TIPOS, listarVigentes, listarTodos, crear, actualizar, eliminar };
