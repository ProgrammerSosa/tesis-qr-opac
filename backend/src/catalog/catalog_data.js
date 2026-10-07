const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');

// Niveles de acceso al documento digital (propuesta, sección 4.2):
//   acceso_descarga = se puede consultar y descargar
//   consulta        = se puede ver en línea, pero no descargar
//   sin_acceso      = no hay documento digital que ofrecer
const ACCESOS = ['acceso_descarga', 'consulta', 'sin_acceso'];

// Tipos de documento de la colección de tesis (propuesta, sección 3.2).
const TIPOS_DOCUMENTO = ['tesis_grado', 'tesis_posgrado', 'tesis_doctoral', 'seminario_posgrado'];

const USAC = 'Universidad de San Carlos de Guatemala';
const FACULTAD = 'Facultad de Ciencias Jurídicas y Sociales';
const LICENCIATURA = 'Licenciatura en Ciencias Jurídicas y Sociales';
const GENERADO = '2026-09-28T15:00:00.000Z';

// Lo que cada tipo de documento lleva por defecto cuando el registro no lo indica.
const POR_TIPO = {
  tesis_grado: { modalidad: 'Tesis de grado', coleccion: 'Tesis de grado', programa: LICENCIATURA },
  tesis_posgrado: { modalidad: 'Tesis de posgrado', coleccion: 'Tesis de posgrado', programa: 'Maestría' },
  tesis_doctoral: { modalidad: 'Tesis doctoral', coleccion: 'Tesis doctorales', programa: 'Doctorado' },
  seminario_posgrado: { modalidad: 'Seminario de posgrado', coleccion: 'Seminarios de posgrado', programa: 'Maestría' },
};

function registroNuevo(base, acceso = 'sin_acceso') {
  const tipoDocumento = base.tipoDocumento ?? 'tesis_grado';
  return {
    facultad: FACULTAD,
    institucion: USAC,
    programa: POR_TIPO[tipoDocumento].programa,
    tipoDocumento,
    modalidad: POR_TIPO[tipoDocumento].modalidad,
    ubicacion: 'Colección de tesis',
    coleccion: POR_TIPO[tipoDocumento].coleccion,
    estado: 'Disponible',
    modalidadAcceso: 'Anaquel cerrado',
    consultaFisica: 'Préstamo interno',
    director: '',
    paginas: null,
    temas: [],
    resumen: '',
    signatura: '',
    ...base,
    documentoDigital: { acceso, activo: true, urlExterna: null, actualizadoEn: GENERADO },
    qr: { activo: true, generadoEn: GENERADO, verificadoEn: null, resultado: null },
  };
}

// Tesis de ejemplo con las que arranca el sistema la primera vez. La biblioteca las reemplaza importando su catálogo
// (sección "Catálogo" del panel); después de eso ya no se usan.
const SEMILLA = [
  registroNuevo(
    {
      id: 'T-2024-00123',
      titulo: 'La conciliación extrajudicial como mecanismo de descongestión en los procesos de familia',
      autor: 'Mariana Fonseca Ríos',
      director: 'Lic. Camilo Restrepo Vega',
      anio: '2024',
      paginas: 118,
      temas: ['Derecho civil', 'Conciliación', 'Procesos de familia'],
      resumen:
        'Analiza el uso de la conciliación extrajudicial como vía para reducir la carga procesal de los juzgados de familia, con base en expedientes de tres centros de conciliación entre 2019 y 2023.',
      signatura: 'T.DER 2024.123',
    },
    'acceso_descarga'
  ),
  registroNuevo(
    {
      id: 'T-2023-00098',
      titulo: 'La mediación familiar frente a la conciliación en equidad',
      autor: 'J. Ariza Londoño',
      director: 'Licda. Paola Jiménez Ruiz',
      anio: '2023',
      paginas: 96,
      temas: ['Derecho civil', 'Mediación'],
      resumen: 'Compara la mediación familiar y la conciliación en equidad como mecanismos alternativos de resolución de conflictos.',
      signatura: 'T.DER 2023.098',
    },
    'consulta'
  ),
  registroNuevo(
    {
      id: 'T-2022-00071',
      titulo: 'Descongestión judicial en los juzgados de familia de la ciudad de Guatemala',
      autor: 'L. Peña Morales',
      director: 'Lic. Camilo Restrepo Vega',
      anio: '2022',
      paginas: 104,
      temas: ['Derecho civil', 'Descongestión judicial'],
      resumen: 'Estudio estadístico sobre la congestión de los despachos de familia en la ciudad de Guatemala entre 2017 y 2021.',
      signatura: 'T.DER 2022.071',
    },
    'sin_acceso'
  ),
  registroNuevo(
    {
      id: 'T-2023-00114',
      titulo: 'Centros de conciliación universitarios: balance 2015–2023',
      autor: 'D. Quintero Salas',
      director: 'Licda. Paola Jiménez Ruiz',
      anio: '2023',
      paginas: 88,
      institucion: 'Universidad Rafael Landívar',
      coleccion: 'Tesis de grado de otras universidades',
      temas: ['Conciliación', 'Clínica jurídica'],
      resumen: 'Balance del funcionamiento de los centros de conciliación universitarios en Guatemala durante los últimos ocho años.',
      signatura: 'T.URL 2023.114',
    },
    'consulta'
  ),
  registroNuevo(
    {
      id: 'T-2021-00045',
      titulo: 'El juicio oral civil y su incidencia en la duración de los procesos',
      autor: 'Héctor Samayoa Pineda',
      director: 'Dr. Luis Fernando Orellana',
      anio: '2021',
      paginas: 164,
      programa: 'Maestría en Derecho Civil y Procesal Civil',
      tipoDocumento: 'tesis_posgrado',
      temas: ['Derecho procesal civil', 'Juicio oral'],
      resumen: 'Mide cuánto tarda un proceso civil oral frente a uno escrito y propone ajustes al procedimiento.',
      signatura: 'TP.DER 2021.045',
    },
    'acceso_descarga'
  ),
  registroNuevo(
    {
      id: 'T-2020-00012',
      titulo: 'Fundamentos constitucionales del acceso a la justicia',
      autor: 'Rosa María Cifuentes Aguilar',
      director: 'Dr. Gabriel Antonio Barrios',
      anio: '2020',
      paginas: 248,
      programa: 'Doctorado en Derecho',
      tipoDocumento: 'tesis_doctoral',
      temas: ['Derecho constitucional', 'Acceso a la justicia'],
      resumen: 'Propone un marco para entender el acceso a la justicia como derecho fundamental y su exigibilidad.',
      signatura: 'TD.DER 2020.012',
    },
    'sin_acceso'
  ),
  registroNuevo(
    {
      id: 'T-2022-00088',
      titulo: 'La mediación penal como alternativa a la prisión preventiva',
      autor: 'Jorge Mauricio Tzoc López',
      director: 'Dra. Silvia Elena Monzón',
      anio: '2022',
      paginas: 72,
      programa: 'Maestría en Derecho Penal',
      tipoDocumento: 'seminario_posgrado',
      temas: ['Derecho penal', 'Mediación'],
      resumen: 'Revisa experiencias de mediación en el proceso penal y su efecto sobre el uso de la prisión preventiva.',
      signatura: 'SP.DER 2022.088',
    },
    'consulta'
  ),
];

// El catálogo vive en el almacén de datos. Es el mismo arreglo mientras el servidor esté encendido: lo que se agrega o se
// quita se hace sobre él, para que los demás módulos que lo importaron vean siempre el estado actual.
const estado = almacen.cargar('catalogo', { tesis: SEMILLA });
const TESIS = estado.tesis;

function guardar() {
  almacen.guardar('catalogo', estado);
}

function digitalDisponible(t) {
  return t.documentoDigital.activo && t.documentoDigital.acceso !== 'sin_acceso';
}

// Lo que ve cualquier visitante: sin el enlace interno del documento ni datos de gestión.
function vistaPublica(t) {
  const { documentoDigital, qr, ...resto } = t;
  return {
    ...resto,
    documentoDigital: { acceso: documentoDigital.acceso, disponible: digitalDisponible(t) },
    qr: { activo: qr.activo },
  };
}

// Lo que ve el personal autorizado en el panel.
function vistaAdmin(t) {
  return { ...t, documentoDigital: { ...t.documentoDigital, disponible: digitalDisponible(t) } };
}

const normalizar = (valor) => String(valor).trim().toLowerCase();

// Busca por los criterios que se indiquen (todos a la vez). Devuelve primero las más recientes.
function buscarTesis({ autor = '', titulo = '', anio = '', tema = '', tipo = '', digital = '' } = {}) {
  const soloDigital = ['1', 'true', 'si'].includes(normalizar(digital));
  return TESIS.filter((t) => {
    if (autor && !normalizar(t.autor).includes(normalizar(autor))) return false;
    if (titulo && !normalizar(t.titulo).includes(normalizar(titulo))) return false;
    if (anio && t.anio !== String(anio).trim()) return false;
    if (tema && !t.temas.some((x) => normalizar(x).includes(normalizar(tema)))) return false;
    if (tipo && t.tipoDocumento !== normalizar(tipo)) return false;
    if (soloDigital && !digitalDisponible(t)) return false;
    return true;
  }).sort((a, b) => b.anio.localeCompare(a.anio) || a.titulo.localeCompare(b.titulo, 'es'));
}

function obtenerPorId(id) {
  return TESIS.find((t) => t.id === id) || null;
}

function tesisRelacionadas(tesisBase, limite = 3) {
  return TESIS.filter((t) => t.id !== tesisBase.id && t.temas.some((tema) => tesisBase.temas.includes(tema))).slice(0, limite);
}

// --- Gestión del personal: documentos digitales y códigos QR ---------------------------------

// Lista para el panel, con búsqueda y paginación (el catálogo real tiene miles de tesis).
function listarParaAdmin({ q = '', pagina = 1, porPagina = 25, documento = '' } = {}) {
  const texto = normalizar(q);
  const filtradas = TESIS.filter((t) => {
    if (documento === 'con' && !digitalDisponible(t)) return false;
    if (documento === 'sin' && digitalDisponible(t)) return false;
    return !texto || [t.id, t.titulo, t.autor, t.signatura].some((v) => normalizar(v ?? '').includes(texto));
  }).sort((a, b) => b.anio.localeCompare(a.anio) || a.titulo.localeCompare(b.titulo, 'es'));

  const tamano = Math.min(Math.max(Number(porPagina) || 25, 1), 100);
  const paginas = Math.max(Math.ceil(filtradas.length / tamano), 1);
  const actual = Math.min(Math.max(Number(pagina) || 1, 1), paginas);
  return { items: filtradas.slice((actual - 1) * tamano, actual * tamano).map(vistaAdmin), total: filtradas.length, pagina: actual, porPagina: tamano, paginas };
}

function actualizarDocumento(id, { acceso, activo, urlExterna }) {
  const t = obtenerPorId(id);
  if (!t) return null;
  if (acceso !== undefined) t.documentoDigital.acceso = acceso;
  if (activo !== undefined) t.documentoDigital.activo = Boolean(activo);
  if (urlExterna !== undefined) t.documentoDigital.urlExterna = urlExterna || null;
  t.documentoDigital.actualizadoEn = new Date().toISOString();
  guardar();
  return vistaAdmin(t);
}

function actualizarQr(id, { activo }) {
  const t = obtenerPorId(id);
  if (!t) return null;
  t.qr.activo = Boolean(activo);
  guardar();
  return vistaAdmin(t);
}

// Comprueba que el documento responda: los internos siempre existen; los externos se consultan por red.
async function documentoResponde(t) {
  if (!digitalDisponible(t)) return null;
  const url = t.documentoDigital.urlExterna;
  if (!url) return true;
  try {
    const respuesta = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
    return respuesta.ok;
  } catch {
    return false;
  }
}

// El código QR lleva a la ficha de la tesis; si además hay documento digital, también se verifica.
async function verificarQr(id) {
  const t = obtenerPorId(id);
  if (!t) return null;
  const responde = await documentoResponde(t);
  t.qr.verificadoEn = new Date().toISOString();
  t.qr.resultado = responde === null ? 'solo_ficha' : responde ? 'ok' : 'enlace_roto';
  guardar();
  return vistaAdmin(t);
}

// --- Gestión del catálogo: alta, cambios, baja e importación ---------------------------------

const FORMATO_DE_CODIGO = /^[A-Za-z0-9][A-Za-z0-9._-]{1,29}$/;

function texto(valor, nombre, minimo, maximo, obligatorio = true) {
  const limpio = String(valor ?? '').trim().replace(/\s+/g, ' ');
  if (!limpio && !obligatorio) return '';
  if (limpio.length < minimo || limpio.length > maximo) {
    throw rechazo(`${nombre}: escribe entre ${minimo} y ${maximo} caracteres`);
  }
  return limpio;
}

// Los temas llegan como lista o como un texto separado por punto y coma (así vienen en una hoja de cálculo).
function listaDeTemas(valor) {
  const lista = Array.isArray(valor) ? valor : String(valor ?? '').split(';');
  return [...new Set(lista.map((t) => String(t).trim()).filter(Boolean))].slice(0, 10).map((t) => t.slice(0, 60));
}

// Valida y completa un registro. `existente` permite cambiar solo algunos campos de una tesis que ya está.
function limpiarTesis(datos, existente = null) {
  const valor = (campo) => (datos[campo] === undefined && existente ? existente[campo] : datos[campo]);

  const id = String(valor('id') ?? '').trim();
  if (!FORMATO_DE_CODIGO.test(id)) {
    throw rechazo('El código de la tesis (su clasificación) debe tener de 2 a 30 letras, números, punto o guion');
  }
  const tipoDocumento = valor('tipoDocumento') || 'tesis_grado';
  if (!TIPOS_DOCUMENTO.includes(tipoDocumento)) {
    throw rechazo('El tipo de documento no es válido');
  }
  const anio = String(valor('anio') ?? '').trim();
  if (!/^\d{4}$/.test(anio) || Number(anio) < 1900 || Number(anio) > new Date().getFullYear() + 1) {
    throw rechazo('El año debe tener cuatro números');
  }
  const paginas = valor('paginas') === '' || valor('paginas') == null ? null : Number(valor('paginas'));
  if (paginas !== null && (!Number.isInteger(paginas) || paginas < 1 || paginas > 5000)) {
    throw rechazo('Las páginas deben ser un número entero');
  }

  const porDefecto = POR_TIPO[tipoDocumento];
  return {
    id,
    titulo: texto(valor('titulo'), 'Título', 5, 400),
    autor: texto(valor('autor'), 'Autor', 3, 120),
    anio,
    tipoDocumento,
    modalidad: porDefecto.modalidad,
    programa: texto(valor('programa') || porDefecto.programa, 'Programa', 2, 160),
    director: texto(valor('director'), 'Director(a)', 0, 120, false),
    paginas,
    temas: listaDeTemas(valor('temas')),
    resumen: texto(valor('resumen'), 'Resumen', 0, 3000, false),
    signatura: texto(valor('signatura'), 'Signatura', 0, 40, false),
    institucion: texto(valor('institucion') || USAC, 'Institución', 2, 120),
    facultad: texto(valor('facultad') || FACULTAD, 'Facultad', 2, 120),
    coleccion: texto(valor('coleccion') || porDefecto.coleccion, 'Colección', 2, 80),
    ubicacion: texto(valor('ubicacion') || 'Colección de tesis', 'Ubicación', 2, 80),
    estado: texto(valor('estado') || 'Disponible', 'Estado', 2, 40),
    modalidadAcceso: texto(valor('modalidadAcceso') || 'Anaquel cerrado', 'Modalidad de acceso', 2, 60),
    consultaFisica: texto(valor('consultaFisica') || 'Préstamo interno', 'Consulta física', 2, 60),
  };
}

function crearTesis(datos) {
  const limpia = limpiarTesis(datos);
  if (obtenerPorId(limpia.id)) {
    throw rechazo('Ya hay una tesis con ese código', 409);
  }
  const ahora = new Date().toISOString();
  const tesis = {
    ...limpia,
    documentoDigital: { acceso: 'sin_acceso', activo: true, urlExterna: null, actualizadoEn: ahora },
    qr: { activo: true, generadoEn: ahora, verificadoEn: null, resultado: null },
  };
  TESIS.push(tesis);
  guardar();
  return vistaAdmin(tesis);
}

// Cambia los datos de una tesis. El código no se cambia: ya está impreso en el QR de la etiqueta.
function actualizarTesis(id, datos) {
  const existente = obtenerPorId(id);
  if (!existente) return null;
  const limpia = limpiarTesis({ ...datos, id }, existente);
  Object.assign(existente, limpia);
  guardar();
  return vistaAdmin(existente);
}

function eliminarTesis(id) {
  const posicion = TESIS.findIndex((t) => t.id === id);
  if (posicion === -1) return null;
  const [quitada] = TESIS.splice(posicion, 1);
  guardar();
  return quitada;
}

const MAXIMO_POR_IMPORTACION = 5000;

// Importa una lista de registros (por ejemplo, la hoja de cálculo del catálogo). Cada fila se valida por separado:
// las buenas se guardan y de las malas se informa el motivo. `existentes` decide qué hacer con un código que ya está
// ('omitir' lo deja como está y 'actualizar' cambia sus datos). `reemplazar` vacía antes el catálogo, incluidas las de ejemplo.
function importarTesis(filas, { existentes = 'omitir', reemplazar = false } = {}) {
  if (!Array.isArray(filas) || filas.length === 0) {
    throw rechazo('No hay filas para importar');
  }
  if (filas.length > MAXIMO_POR_IMPORTACION) {
    throw rechazo(`Importa como máximo ${MAXIMO_POR_IMPORTACION} filas por vez`);
  }
  if (!['omitir', 'actualizar'].includes(existentes)) {
    throw rechazo('Indica qué hacer con las tesis que ya existen');
  }

  // Se valida todo antes de tocar el catálogo, para que reemplazar nunca deje el catálogo vacío por un error.
  const validas = [];
  const errores = [];
  filas.forEach((fila, i) => {
    try {
      validas.push({ numero: i + 1, tesis: limpiarTesis(fila ?? {}) });
    } catch (error) {
      errores.push({ fila: i + 1, motivo: error.message });
    }
  });
  if (validas.length === 0) {
    return { creadas: 0, actualizadas: 0, omitidas: 0, errores: errores.slice(0, 50), totalErrores: errores.length };
  }

  if (reemplazar) TESIS.splice(0, TESIS.length);

  let creadas = 0;
  let actualizadas = 0;
  let omitidas = 0;
  const ahora = new Date().toISOString();
  validas.forEach(({ tesis }) => {
    const previa = obtenerPorId(tesis.id);
    if (!previa) {
      TESIS.push({
        ...tesis,
        documentoDigital: { acceso: 'sin_acceso', activo: true, urlExterna: null, actualizadoEn: ahora },
        qr: { activo: true, generadoEn: ahora, verificadoEn: null, resultado: null },
      });
      creadas += 1;
    } else if (existentes === 'actualizar') {
      Object.assign(previa, tesis);
      actualizadas += 1;
    } else {
      omitidas += 1;
    }
  });
  guardar();
  return { creadas, actualizadas, omitidas, errores: errores.slice(0, 50), totalErrores: errores.length };
}

module.exports = {
  ACCESOS,
  TIPOS_DOCUMENTO,
  TESIS,
  digitalDisponible,
  vistaPublica,
  vistaAdmin,
  buscarTesis,
  obtenerPorId,
  tesisRelacionadas,
  listarParaAdmin,
  actualizarDocumento,
  actualizarQr,
  verificarQr,
  crearTesis,
  actualizarTesis,
  eliminarTesis,
  importarTesis,
};
