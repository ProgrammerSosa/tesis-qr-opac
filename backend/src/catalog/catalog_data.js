const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');

// Niveles de acceso al documento digital (propuesta, sección 4.2):
//   acceso_descarga = se puede consultar y descargar
//   consulta        = se puede ver en línea, pero no descargar
//   sin_acceso      = no hay documento digital que ofrecer
const ACCESOS = ['acceso_descarga', 'consulta', 'sin_acceso'];

// A dónde lleva el código QR impreso en la etiqueta (propuesta, sección 4.3):
//   enlace = al enlace corto de este sistema (/r/<código>), que abre la URL de la tesis: si la URL cambia, la etiqueta ya impresa
//            sigue sirviendo, y se cuentan los escaneos. Es lo que se usa por defecto.
//   url    = la URL de la tesis tal cual, escrita dentro del código: sirve aunque este sistema no esté en línea, pero si la URL
//            cambia hay que reimprimir la etiqueta y no se cuentan los escaneos.
//   ficha  = a la ficha de la tesis en este sistema: una dirección que no cambia aunque cambie el archivo digital
// Sin URL de la tesis, o si el documento no se ofrece al público, el código siempre lleva a la ficha.
const DESTINOS_DEL_QR = ['enlace', 'url', 'ficha'];
const DESTINO_POR_DEFECTO = 'enlace';

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
    qr: { activo: true, destino: DESTINO_POR_DEFECTO, generadoEn: GENERADO, verificadoEn: null, resultado: null },
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

// Los datos guardados antes de que existiera el destino del QR traen códigos que llevan a la ficha: se conservan así.
TESIS.forEach((t) => {
  if (t.qr && t.qr.destino === undefined) t.qr.destino = 'ficha';
});

function guardar() {
  almacen.guardar('catalogo', estado);
}

function digitalDisponible(t) {
  return t.documentoDigital.activo && t.documentoDigital.acceso !== 'sin_acceso';
}

// A dónde lleva de verdad el código QR de una tesis: lo que eligió el personal, salvo que no haya URL que ofrecer (sin URL, sin
// acceso, documento o código desactivados), en cuyo caso lleva a la ficha.
function destinoEfectivoDelQr(t) {
  const hayUrl = Boolean(t.documentoDigital.urlExterna) && t.qr.activo && digitalDisponible(t);
  return hayUrl && DESTINOS_DEL_QR.includes(t.qr.destino) ? t.qr.destino : 'ficha';
}

// Lo que ve cualquier visitante: sin el enlace interno del documento ni datos de gestión. Del código QR se dice a dónde lleva
// (`qr.destino`) para dibujar en el sitio el mismo código que va impreso en la etiqueta. La URL de la tesis (`qr.enlace`) solo
// viaja cuando el código la lleva escrita tal cual: en ese caso es lo mismo que ya revela el código impreso.
function vistaPublica(t) {
  const { documentoDigital, qr, ...resto } = t;
  const destino = destinoEfectivoDelQr(t);
  return {
    ...resto,
    documentoDigital: { acceso: documentoDigital.acceso, disponible: digitalDisponible(t) },
    qr: { activo: qr.activo, destino, enlace: destino === 'url' ? documentoDigital.urlExterna : null },
  };
}

// Lo que ve el personal autorizado en el panel.
function vistaAdmin(t) {
  return { ...t, documentoDigital: { ...t.documentoDigital, disponible: digitalDisponible(t) } };
}

const normalizar = (valor) => String(valor).trim().toLowerCase();

// Orden de las listas: primero las más recientes y, dentro de un año, por título como en un diccionario en español. Se usa un solo
// comparador ya preparado: pedirle a cada título que se compare «en español» (localeCompare) tarda segundos con miles de tesis.
const ORDEN_EN_ESPANOL = new Intl.Collator('es');
function masRecientesPrimero(a, b) {
  if (a.anio !== b.anio) return a.anio < b.anio ? 1 : -1;
  return ORDEN_EN_ESPANOL.compare(a.titulo, b.titulo);
}

// --- Búsqueda por texto ------------------------------------------------------------------------
// La gente escribe como le sale: sin tildes, en mayúsculas, con el apellido primero o solo algunas palabras del título. Para comparar,
// los textos se «aplanan» (sin tildes ni eñes, en minúsculas y con cualquier signo convertido en espacio) y lo buscado se parte en
// palabras por sus espacios y comas: una tesis coincide si tiene TODAS, en cualquier orden y aunque sea como parte de una palabra más
// larga. Lo que se escribe pegado con un signo en medio («T-2021-00045», «2015–2023») se busca como un solo bloque seguido: así un
// código encuentra su tesis y no todas las que tengan sus pedazos.
const MARCAS_DE_TILDE = /\p{M}/gu; // las marcas que quedan sueltas al separar la letra de su tilde (NFD)

function aplanar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(MARCAS_DE_TILDE, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const palabrasDe = (valor) =>
  String(valor ?? '')
    .split(/[\s,;]+/)
    .map(aplanar)
    .filter(Boolean);
const tieneTodas = (texto, palabras) => palabras.every((palabra) => texto.includes(palabra));

// Aplanar miles de títulos en cada búsqueda es trabajo repetido: se guarda el texto aplanado de cada tesis mientras no cambie.
const textosAplanados = new WeakMap(); // tesis -> { origen, titulo, autor, temas, panel }

function textosDe(t) {
  const origen = [t.titulo, t.autor, t.temas.join('\n'), t.id, t.signatura].join('\n');
  const guardado = textosAplanados.get(t);
  if (guardado && guardado.origen === origen) return guardado;
  const nuevo = {
    origen,
    titulo: aplanar(t.titulo),
    autor: aplanar(t.autor),
    temas: aplanar(t.temas.join(' ')),
    panel: aplanar([t.id, t.titulo, t.autor, t.signatura].join(' ')),
  };
  textosAplanados.set(t, nuevo);
  return nuevo;
}

// Busca por los criterios que se indiquen (todos a la vez). Devuelve primero las más recientes.
function buscarTesis({ autor = '', titulo = '', anio = '', tema = '', tipo = '', digital = '' } = {}) {
  const soloDigital = ['1', 'true', 'si'].includes(normalizar(digital));
  const delAutor = palabrasDe(autor);
  const delTitulo = palabrasDe(titulo);
  const delTema = palabrasDe(tema);
  const porTexto = delAutor.length + delTitulo.length + delTema.length > 0;
  return TESIS.filter((t) => {
    if (anio && t.anio !== String(anio).trim()) return false;
    if (tipo && t.tipoDocumento !== normalizar(tipo)) return false;
    if (soloDigital && !digitalDisponible(t)) return false;
    if (!porTexto) return true;
    const textos = textosDe(t);
    return tieneTodas(textos.autor, delAutor) && tieneTodas(textos.titulo, delTitulo) && tieneTodas(textos.temas, delTema);
  }).sort(masRecientesPrimero);
}

function obtenerPorId(id) {
  return TESIS.find((t) => t.id === id) || null;
}

function tesisRelacionadas(tesisBase, limite = 3) {
  return TESIS.filter((t) => t.id !== tesisBase.id && t.temas.some((tema) => tesisBase.temas.includes(tema))).slice(0, limite);
}

// --- Gestión del personal: documentos digitales y códigos QR ---------------------------------

// Lista para el panel, con búsqueda y paginación (el catálogo real tiene miles de tesis).
// `verificacion` deja solo las tesis con el enlace roto ('rotos'), las que el sitio no dejó comprobar ('sin_comprobar') o las que
// todavía no se verifican ('sin_verificar').
function listarParaAdmin({ q = '', pagina = 1, porPagina = 25, documento = '', verificacion = '' } = {}) {
  // Lo escrito se busca a la vez en el código, el título, el autor y la signatura (ver «Búsqueda por texto»).
  const buscadas = palabrasDe(q);
  const filtradas = TESIS.filter((t) => {
    if (documento === 'con' && !digitalDisponible(t)) return false;
    if (documento === 'sin' && digitalDisponible(t)) return false;
    if (verificacion === 'rotos' && t.qr.resultado !== 'enlace_roto') return false;
    if (verificacion === 'sin_comprobar' && t.qr.resultado !== 'sin_comprobar') return false;
    if (verificacion === 'sin_verificar' && t.qr.verificadoEn) return false;
    return buscadas.length === 0 || tieneTodas(textosDe(t).panel, buscadas);
  }).sort(masRecientesPrimero);

  const tamano = Math.min(Math.max(Number(porPagina) || 25, 1), 100);
  const paginas = Math.max(Math.ceil(filtradas.length / tamano), 1);
  const actual = Math.min(Math.max(Number(pagina) || 1, 1), paginas);
  return { items: filtradas.slice((actual - 1) * tamano, actual * tamano).map(vistaAdmin), total: filtradas.length, pagina: actual, porPagina: tamano, paginas };
}

const MAXIMO_DE_URL = 2000;

// La URL de la tesis: el enlace de acceso a su documento digital. Vacía quiere decir que no hay enlace (null).
// Se guarda normalizada (con el formato que entiende cualquier navegador y lector de QR).
function limpiarUrl(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;
  if (texto.length > MAXIMO_DE_URL) {
    throw rechazo(`La URL de la tesis es demasiado larga (máximo ${MAXIMO_DE_URL} caracteres)`);
  }
  let url = null;
  try {
    url = /\s/.test(texto) ? null : new URL(texto);
  } catch {
    url = null;
  }
  if (!url || !['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw rechazo('La URL de la tesis debe empezar con http:// o https:// y no llevar espacios');
  }
  return url.href;
}

// Datos del documento digital que llegan junto con el formulario de la tesis o con una fila de la hoja de cálculo:
// `urlTesis` (la URL), `acceso` (el nivel de acceso) y `destinoQr` (a dónde lleva el código QR). Devuelve solo lo que se
// indicó, ya validado, para no pisar lo que no vino.
function limpiarDocumento(datos = {}) {
  const cambios = {};
  if (datos.urlTesis !== undefined) cambios.urlExterna = limpiarUrl(datos.urlTesis);
  if (datos.acceso !== undefined && datos.acceso !== '' && datos.acceso !== null) {
    if (!ACCESOS.includes(datos.acceso)) throw rechazo('El nivel de acceso al documento no es válido');
    cambios.acceso = datos.acceso;
  }
  if (datos.destinoQr !== undefined && datos.destinoQr !== '' && datos.destinoQr !== null) {
    if (!DESTINOS_DEL_QR.includes(datos.destinoQr)) throw rechazo('El destino del código QR no es válido');
    cambios.destinoQr = datos.destinoQr;
  }
  return cambios;
}

// Documento digital y código QR de una tesis recién agregada. Con URL y sin nivel de acceso indicado, el documento queda
// en «consulta» (se ve en línea, sin descarga): descargar es una decisión que se toma de forma explícita.
function documentoYQrNuevos(cambios, ahora) {
  const acceso = cambios.acceso ?? (cambios.urlExterna ? 'consulta' : 'sin_acceso');
  return {
    documentoDigital: { acceso, activo: true, urlExterna: cambios.urlExterna ?? null, actualizadoEn: ahora },
    qr: { activo: true, destino: cambios.destinoQr ?? DESTINO_POR_DEFECTO, generadoEn: ahora, verificadoEn: null, resultado: null },
  };
}

// Aplica sobre una tesis que ya existe los cambios de documento y QR que sí se indicaron.
function aplicarDocumentoYQr(t, cambios) {
  const doc = t.documentoDigital;
  let huboCambio = false;
  if (cambios.urlExterna !== undefined && cambios.urlExterna !== (doc.urlExterna ?? null)) {
    doc.urlExterna = cambios.urlExterna;
    huboCambio = true;
  }
  if (cambios.acceso !== undefined && cambios.acceso !== doc.acceso) {
    doc.acceso = cambios.acceso;
    huboCambio = true;
  }
  if (huboCambio) {
    doc.actualizadoEn = new Date().toISOString();
    // Un código que se verificó con otro destino ya no vale como verificado.
    t.qr.verificadoEn = null;
    t.qr.resultado = null;
  }
  if (cambios.destinoQr !== undefined && cambios.destinoQr !== t.qr.destino) {
    t.qr.destino = cambios.destinoQr;
    t.qr.verificadoEn = null;
    t.qr.resultado = null;
  }
}

function actualizarDocumento(id, { acceso, activo, urlExterna }) {
  const t = obtenerPorId(id);
  if (!t) return null;
  if (acceso !== undefined) t.documentoDigital.acceso = acceso;
  if (activo !== undefined) t.documentoDigital.activo = Boolean(activo);
  if (urlExterna !== undefined) t.documentoDigital.urlExterna = urlExterna || null;
  t.documentoDigital.actualizadoEn = new Date().toISOString();
  t.qr.verificadoEn = null;
  t.qr.resultado = null;
  guardar();
  return vistaAdmin(t);
}

function actualizarQr(id, { activo, destino }) {
  const t = obtenerPorId(id);
  if (!t) return null;
  if (activo !== undefined) t.qr.activo = Boolean(activo);
  if (destino !== undefined && destino !== t.qr.destino) {
    t.qr.destino = destino;
    t.qr.verificadoEn = null;
    t.qr.resultado = null;
  }
  guardar();
  return vistaAdmin(t);
}

// --- Verificación de los enlaces ----------------------------------------------------------------
// Resultado de verificar el código de una tesis (`qr.resultado`):
//   ok            = su documento responde (el de ejemplo del sistema siempre; una URL, si el sitio contesta bien)
//   solo_ficha    = no hay documento que ofrecer: el código lleva a la ficha
//   enlace_roto   = la URL no responde, ya no existe o el sitio falla
//   sin_comprobar = el sitio contestó pero rechaza las revisiones automáticas (401, 403 o 429): puede estar bien; hay que abrirlo a mano

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));
const ESPERA_POR_PEDIDO_MS = 6000;
// Antes de dar un enlace por roto se intenta una vez más un momento después (VERIFICAR_ENLACES_REINTENTO_MS existe para las pruebas).
const ESPERA_ANTES_DE_REINTENTAR_MS = Number(process.env.VERIFICAR_ENLACES_REINTENTO_MS) || 2000;
const SITIO_QUE_NO_DEJA_REVISAR = [401, 403, 429];

// Pide la dirección sin descargarla y devuelve el código con el que contestó el sitio: primero con HEAD; si el sitio no lo admite
// (Drive, blogs y muchos servidores responden 400, 403, 405 o 501 a HEAD aunque el documento exista), se repite con GET y se descarta
// el cuerpo.
async function estadoDe(url) {
  const opciones = { redirect: 'follow', signal: AbortSignal.timeout(ESPERA_POR_PEDIDO_MS) };
  let respuesta = await fetch(url, { ...opciones, method: 'HEAD' });
  if (!respuesta.ok && [400, 403, 405, 501].includes(respuesta.status)) {
    respuesta = await fetch(url, { ...opciones, method: 'GET' });
    respuesta.body?.cancel().catch(() => {});
  }
  return respuesta.status;
}

// Comprueba una URL: 'ok', 'enlace_roto' o 'sin_comprobar'. Lo que puede ser pasajero (no conecta, tarda demasiado o el sitio falla)
// se reintenta una vez; lo definitivo (404, 410...) no.
async function comprobarUrl(url) {
  for (let intento = 1; ; intento += 1) {
    let estado = null;
    try {
      estado = await estadoDe(url);
    } catch {
      // no conectó o tardó demasiado
    }
    if (estado !== null && estado >= 200 && estado < 300) return 'ok';
    if (SITIO_QUE_NO_DEJA_REVISAR.includes(estado)) return 'sin_comprobar';
    const puedeSerPasajero = estado === null || estado === 408 || estado >= 500;
    if (!puedeSerPasajero || intento === 2) return 'enlace_roto';
    await pausa(ESPERA_ANTES_DE_REINTENTAR_MS);
  }
}

const necesitaRed = (t) => digitalDisponible(t) && Boolean(t.documentoDigital.urlExterna);

// Verifica una tesis y anota el resultado (sin guardar: quien llama decide cuándo). Devuelve { antes, despues }.
async function verificar(t) {
  const antes = t.qr.resultado ?? null;
  let despues = 'solo_ficha';
  if (necesitaRed(t)) despues = await comprobarUrl(t.documentoDigital.urlExterna);
  else if (digitalDisponible(t)) despues = 'ok'; // el documento de ejemplo del sistema siempre está
  t.qr.verificadoEn = new Date().toISOString();
  t.qr.resultado = despues;
  return { antes, despues };
}

// Verifica el código QR: lleva a la ficha de la tesis o directo a su URL (según el destino) y, si la tesis tiene documento
// digital, también se comprueba que el enlace responda.
async function verificarQr(id) {
  const t = obtenerPorId(id);
  if (!t) return null;
  await verificar(t);
  guardar();
  return vistaAdmin(t);
}

const DIA_MS = 24 * 60 * 60 * 1000;

// A qué tesis les toca verificarse: las que nunca se verificaron (o cambiaron de URL), las correctas cada `dias` días y las rotas cada
// día, para que un enlace que vuelve a funcionar deje pronto de figurar como roto.
function leTocaVerificarse(t, dias, ahora = Date.now()) {
  if (!t.qr.verificadoEn) return true;
  const cada = t.qr.resultado === 'enlace_roto' ? 1 : dias;
  return ahora - Date.parse(t.qr.verificadoEn) >= cada * DIA_MS;
}

function contarVerificaciones(dias) {
  let pendientes = 0;
  let rotos = 0;
  let sinComprobar = 0;
  const ahora = Date.now();
  TESIS.forEach((t) => {
    if (leTocaVerificarse(t, dias, ahora)) pendientes += 1;
    if (t.qr.resultado === 'enlace_roto') rotos += 1;
    if (t.qr.resultado === 'sin_comprobar') sinComprobar += 1;
  });
  return { pendientes, rotos, sinComprobar };
}

// Verifica hasta `maximo` de las tesis a las que les toca, primero las que nunca se verificaron y después las más antiguas. Entre un
// pedido de red y el siguiente espera `pausaMs`, para no cargar al sitio donde están los documentos. Guarda de a tandas.
// Devuelve cuántas revisó y cuáles quedaron rotas o volvieron a funcionar.
async function verificarPendientes({ dias, maximo = 200, pausaMs = 1000 } = {}) {
  const ahora = Date.now();
  const lista = TESIS.filter((t) => leTocaVerificarse(t, dias, ahora))
    .sort((a, b) => {
      const deA = a.qr.verificadoEn ?? '';
      const deB = b.qr.verificadoEn ?? '';
      return deA === deB ? 0 : deA < deB ? -1 : 1;
    })
    .slice(0, maximo);
  const rotas = [];
  const recuperadas = [];
  let sinGuardar = 0;
  for (const t of lista) {
    const usaRed = necesitaRed(t);
    const { antes, despues } = await verificar(t);
    if (despues === 'enlace_roto' && antes !== 'enlace_roto') rotas.push(t.id);
    if (antes === 'enlace_roto' && despues !== 'enlace_roto') recuperadas.push(t.id);
    sinGuardar += 1;
    if (sinGuardar >= 25) {
      guardar();
      sinGuardar = 0;
    }
    if (usaRed && pausaMs > 0) await pausa(pausaMs);
  }
  if (sinGuardar > 0) guardar();
  return { revisadas: lista.length, rotas, recuperadas };
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

// Agrega una tesis. Además de sus datos puede traer la URL de la tesis (`urlTesis`), el nivel de acceso (`acceso`) y a
// dónde lleva su código QR (`destinoQr`): así la tesis queda con su documento y su código listos desde el alta.
function crearTesis(datos) {
  const limpia = limpiarTesis(datos);
  const documento = limpiarDocumento(datos);
  if (obtenerPorId(limpia.id)) {
    throw rechazo('Ya hay una tesis con ese código', 409);
  }
  const tesis = { ...limpia, ...documentoYQrNuevos(documento, new Date().toISOString()) };
  TESIS.push(tesis);
  guardar();
  return vistaAdmin(tesis);
}

// Cambia los datos de una tesis (y, si se indican, su URL, su nivel de acceso y el destino de su QR). El código no se
// cambia: ya está impreso en el QR de la etiqueta.
function actualizarTesis(id, datos) {
  const existente = obtenerPorId(id);
  if (!existente) return null;
  const limpia = limpiarTesis({ ...datos, id }, existente);
  const documento = limpiarDocumento(datos);
  Object.assign(existente, limpia);
  aplicarDocumentoYQr(existente, documento);
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
      validas.push({ numero: i + 1, tesis: limpiarTesis(fila ?? {}), documento: limpiarDocumento(fila ?? {}) });
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
  validas.forEach(({ tesis, documento }) => {
    const previa = obtenerPorId(tesis.id);
    if (!previa) {
      TESIS.push({ ...tesis, ...documentoYQrNuevos(documento, ahora) });
      creadas += 1;
    } else if (existentes === 'actualizar') {
      Object.assign(previa, tesis);
      aplicarDocumentoYQr(previa, documento);
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
  DESTINOS_DEL_QR,
  TIPOS_DOCUMENTO,
  limpiarUrl,
  TESIS,
  digitalDisponible,
  destinoEfectivoDelQr,
  vistaPublica,
  vistaAdmin,
  buscarTesis,
  obtenerPorId,
  tesisRelacionadas,
  listarParaAdmin,
  actualizarDocumento,
  actualizarQr,
  verificarQr,
  verificarPendientes,
  contarVerificaciones,
  crearTesis,
  actualizarTesis,
  eliminarTesis,
  importarTesis,
};
