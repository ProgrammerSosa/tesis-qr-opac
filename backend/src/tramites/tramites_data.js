const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');
const { generarCodigoConfirmacion, correoValido } = require('../../utils/codigos');
const { obtenerPorId } = require('../catalog/catalog_data');

// Dos solicitudes que la biblioteca recibe desde su sitio y atiende por correo:
//   - tesis en formato digital: una tesis que aún no está en el repositorio. La biblioteca puede publicar las de grado
//     desde 2010 y las de posgrado desde 2016, y avisa a la persona cuando ya se puede consultar o descargar;
//   - referencias bibliográficas: la persona indica el tema y la fuente y recibe la referencia en 24 horas hábiles.
const ANIO_MINIMO_GRADO = 2010;
const ANIO_MINIMO_POSGRADO = 2016;

// `estados` dice a qué estados se puede pasar desde cada uno. `roles` son quienes atienden esa solicitud.
const TIPOS = {
  tesis_digital: {
    prefijo: 'TD',
    nombre: 'Solicitud de tesis en formato digital',
    roles: ['administrador', 'tesis'],
    estados: { pendiente: ['en_proceso', 'publicada', 'rechazada'], en_proceso: ['publicada', 'rechazada'], publicada: [], rechazada: [] },
  },
  referencias: {
    prefijo: 'REF',
    nombre: 'Solicitud de referencias bibliográficas',
    roles: ['administrador', 'circulacion'],
    estados: { pendiente: ['respondida', 'rechazada'], respondida: [], rechazada: [] },
  },
};

const estado = almacen.cargar('tramites', { tramites: [], contadores: { TD: 0, REF: 0 } });
const tramites = estado.tramites;

function guardar() {
  almacen.guardar('tramites', estado);
}

function siguienteCodigo(tipo) {
  const { prefijo } = TIPOS[tipo];
  estado.contadores[prefijo] = (estado.contadores[prefijo] ?? 0) + 1;
  return `${prefijo}-${String(estado.contadores[prefijo]).padStart(3, '0')}`;
}

function kioscoValido(kiosco) {
  return typeof kiosco === 'string' && /^[0-9A-Za-z_-]{1,10}$/.test(kiosco) ? kiosco : null;
}

function texto(valor, nombre, minimo, maximo) {
  const limpio = String(valor ?? '').trim().replace(/\s+/g, ' ');
  if (limpio.length < minimo || limpio.length > maximo) {
    throw rechazo(`${nombre}: escribe entre ${minimo} y ${maximo} caracteres`);
  }
  return limpio;
}

function datosDeQuienSolicita({ solicitante, identificacion, correo }) {
  const correoLimpio = String(correo ?? '').trim();
  if (!correoValido(correoLimpio)) {
    throw rechazo('Escribe un correo válido: ahí recibirás la respuesta');
  }
  const documento = String(identificacion ?? '').trim();
  if (documento && !/^[0-9A-Za-z-]{5,20}$/.test(documento)) {
    throw rechazo('El carné o documento debe tener de 5 a 20 letras o números (o déjalo en blanco)');
  }
  return {
    solicitante: texto(solicitante, 'Nombre completo', 3, 80),
    ...(documento ? { identificacion: documento.toUpperCase() } : {}),
    correo: correoLimpio,
  };
}

function datosDeTesisDigital({ nivel, clasificacion, autor, titulo, anio, tesisId }) {
  if (!['grado', 'posgrado'].includes(nivel)) {
    throw rechazo('Indica si la tesis es de grado o de posgrado');
  }
  const anioNumero = Number(anio);
  const minimo = nivel === 'grado' ? ANIO_MINIMO_GRADO : ANIO_MINIMO_POSGRADO;
  if (!Number.isInteger(anioNumero) || anioNumero > new Date().getFullYear() + 1) {
    throw rechazo('Escribe el año de la tesis con cuatro números');
  }
  if (anioNumero < minimo) {
    throw rechazo(
      `La biblioteca solo puede publicar en formato digital las tesis de ${nivel} desde el año ${minimo}. Para una tesis anterior, consulta el ejemplar impreso en la biblioteca.`
    );
  }
  const codigo = texto(clasificacion, 'Clasificación', 3, 30);
  const enCatalogo = tesisId ? obtenerPorId(String(tesisId)) : null;
  return {
    nivel,
    clasificacion: codigo.toUpperCase(),
    autor: texto(autor, 'Autor', 3, 120),
    titulo: texto(titulo, 'Título', 5, 400),
    anio: anioNumero,
    ...(enCatalogo ? { tesisId: enCatalogo.id } : {}),
  };
}

function datosDeReferencias({ tema, fuente }) {
  return { tema: texto(tema, 'Tema', 5, 400), fuente: texto(fuente, 'Fuente', 3, 400) };
}

function crear(tipo, datos) {
  if (!TIPOS[tipo]) throw rechazo('Ese tipo de solicitud no existe', 404);
  // Primero se valida todo: un número de solicitud solo se gasta si la solicitud se va a guardar.
  const especificos = tipo === 'tesis_digital' ? datosDeTesisDigital(datos) : datosDeReferencias(datos);
  const deQuienSolicita = datosDeQuienSolicita(datos);
  const tramite = {
    id: siguienteCodigo(tipo),
    tipo,
    ...deQuienSolicita,
    ...especificos,
    ...(kioscoValido(datos.kiosco) ? { kiosco: kioscoValido(datos.kiosco) } : {}),
    codigoConfirmacion: generarCodigoConfirmacion(),
    estado: 'pendiente',
    creadoEn: new Date().toISOString(),
  };
  tramites.push(tramite);
  guardar();
  return tramite;
}

function buscar(id) {
  return tramites.find((t) => t.id === id) || null;
}

function listar({ tipo, estado: estadoPedido, tipos } = {}) {
  return tramites
    .filter((t) => (!tipo || t.tipo === tipo) && (!tipos || tipos.includes(t.tipo)) && (!estadoPedido || t.estado === estadoPedido))
    .slice()
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

// Cambia el estado de una solicitud respetando los pasos permitidos. Al rechazar hay que explicar por qué, y al
// responder una referencia hay que escribir la respuesta: esos textos le llegan a la persona por correo.
function cambiarEstado(id, { estado: nuevo, observacion, tesisId } = {}, sesion) {
  const tramite = buscar(id);
  if (!tramite) return null;
  const permitidos = TIPOS[tramite.tipo].estados[tramite.estado] ?? [];
  if (!permitidos.includes(nuevo)) {
    throw rechazo('Esa solicitud no puede pasar a ese estado', 409);
  }

  const nota = String(observacion ?? '').trim();
  if (nuevo === 'rechazada' && (nota.length < 3 || nota.length > 500)) {
    throw rechazo('Escribe el motivo (de 3 a 500 caracteres): la persona lo recibirá por correo');
  }
  if (nuevo === 'respondida' && (nota.length < 5 || nota.length > 3000)) {
    throw rechazo('Escribe la respuesta con la referencia (de 5 a 3000 caracteres): la persona la recibirá por correo');
  }
  if (nota.length > 3000) {
    throw rechazo('La observación es demasiado larga');
  }

  // Se comprueba todo antes de cambiar nada: si algo falla, la solicitud queda como estaba.
  const enCatalogo = nuevo === 'publicada' && tesisId ? obtenerPorId(String(tesisId)) : null;
  if (nuevo === 'publicada' && tesisId && !enCatalogo) {
    throw rechazo('Esa tesis no está en el catálogo', 404);
  }

  tramite.estado = nuevo;
  if (nota) tramite.observacion = nota;
  if (enCatalogo) tramite.tesisId = enCatalogo.id;
  if (['publicada', 'respondida', 'rechazada'].includes(nuevo)) tramite.atendidaEn = new Date().toISOString();
  tramite.atendidaPor = sesion?.usuario ?? null;
  guardar();
  return tramite;
}

function resumen() {
  return Object.fromEntries(Object.keys(TIPOS).map((tipo) => [tipo, tramites.filter((t) => t.tipo === tipo && t.estado === 'pendiente').length]));
}

module.exports = { ANIO_MINIMO_GRADO, ANIO_MINIMO_POSGRADO, TIPOS, crear, buscar, listar, cambiarEstado, resumen };
