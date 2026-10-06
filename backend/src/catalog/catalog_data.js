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

// Los datos de las tesis son de ejemplo; solo la estructura corresponde al registro del OPAC.
function tesis(base, acceso) {
  return {
    facultad: FACULTAD,
    institucion: USAC,
    programa: LICENCIATURA,
    tipoDocumento: 'tesis_grado',
    modalidad: 'Tesis de grado',
    ubicacion: 'Colección de tesis',
    coleccion: 'Tesis de grado',
    estado: 'Disponible',
    modalidadAcceso: 'Anaquel cerrado',
    consultaFisica: 'Préstamo interno',
    ...base,
    documentoDigital: { acceso, activo: true, urlExterna: null, actualizadoEn: GENERADO },
    qr: { activo: true, generadoEn: GENERADO, verificadoEn: null, resultado: null },
  };
}

const TESIS = [
  tesis(
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
  tesis(
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
  tesis(
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
  tesis(
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
  tesis(
    {
      id: 'T-2021-00045',
      titulo: 'El juicio oral civil y su incidencia en la duración de los procesos',
      autor: 'Héctor Samayoa Pineda',
      director: 'Dr. Luis Fernando Orellana',
      anio: '2021',
      paginas: 164,
      programa: 'Maestría en Derecho Civil y Procesal Civil',
      tipoDocumento: 'tesis_posgrado',
      modalidad: 'Tesis de posgrado',
      coleccion: 'Tesis de posgrado',
      temas: ['Derecho procesal civil', 'Juicio oral'],
      resumen: 'Mide cuánto tarda un proceso civil oral frente a uno escrito y propone ajustes al procedimiento.',
      signatura: 'TP.DER 2021.045',
    },
    'acceso_descarga'
  ),
  tesis(
    {
      id: 'T-2020-00012',
      titulo: 'Fundamentos constitucionales del acceso a la justicia',
      autor: 'Rosa María Cifuentes Aguilar',
      director: 'Dr. Gabriel Antonio Barrios',
      anio: '2020',
      paginas: 248,
      programa: 'Doctorado en Derecho',
      tipoDocumento: 'tesis_doctoral',
      modalidad: 'Tesis doctoral',
      coleccion: 'Tesis doctorales',
      temas: ['Derecho constitucional', 'Acceso a la justicia'],
      resumen: 'Propone un marco para entender el acceso a la justicia como derecho fundamental y su exigibilidad.',
      signatura: 'TD.DER 2020.012',
    },
    'sin_acceso'
  ),
  tesis(
    {
      id: 'T-2022-00088',
      titulo: 'La mediación penal como alternativa a la prisión preventiva',
      autor: 'Jorge Mauricio Tzoc López',
      director: 'Dra. Silvia Elena Monzón',
      anio: '2022',
      paginas: 72,
      programa: 'Maestría en Derecho Penal',
      tipoDocumento: 'seminario_posgrado',
      modalidad: 'Seminario de posgrado',
      coleccion: 'Seminarios de posgrado',
      temas: ['Derecho penal', 'Mediación'],
      resumen: 'Revisa experiencias de mediación en el proceso penal y su efecto sobre el uso de la prisión preventiva.',
      signatura: 'SP.DER 2022.088',
    },
    'consulta'
  ),
];

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

function buscarTesis({ autor = '', titulo = '', anio = '', tema = '', tipo = '', digital = '' } = {}) {
  const norm = (v) => String(v).trim().toLowerCase();
  const soloDigital = ['1', 'true', 'si'].includes(norm(digital));
  return TESIS.filter((t) => {
    if (autor && !norm(t.autor).includes(norm(autor))) return false;
    if (titulo && !norm(t.titulo).includes(norm(titulo))) return false;
    if (anio && t.anio !== String(anio).trim()) return false;
    if (tema && !t.temas.some((x) => norm(x).includes(norm(tema)))) return false;
    if (tipo && t.tipoDocumento !== norm(tipo)) return false;
    if (soloDigital && !digitalDisponible(t)) return false;
    return true;
  });
}

function obtenerPorId(id) {
  return TESIS.find((t) => t.id === id) || null;
}

function tesisRelacionadas(tesisBase, limite = 3) {
  return TESIS.filter((t) => t.id !== tesisBase.id && t.temas.some((tema) => tesisBase.temas.includes(tema))).slice(0, limite);
}

// --- Gestión del personal: documentos digitales y códigos QR ---------------------------------

function listarParaAdmin() {
  return TESIS.map(vistaAdmin);
}

function actualizarDocumento(id, { acceso, activo, urlExterna }) {
  const t = obtenerPorId(id);
  if (!t) return null;
  if (acceso !== undefined) t.documentoDigital.acceso = acceso;
  if (activo !== undefined) t.documentoDigital.activo = Boolean(activo);
  if (urlExterna !== undefined) t.documentoDigital.urlExterna = urlExterna || null;
  t.documentoDigital.actualizadoEn = new Date().toISOString();
  return vistaAdmin(t);
}

function actualizarQr(id, { activo }) {
  const t = obtenerPorId(id);
  if (!t) return null;
  t.qr.activo = Boolean(activo);
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
  return vistaAdmin(t);
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
};
