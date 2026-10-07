const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');
const { generarCodigoConfirmacion, correoValido } = require('../../utils/codigos');
const { esFechaISO, fechaLocal, minutosDelDia, sumarDias } = require('../../utils/fechas');
const horarios = require('../horarios/horarios_data');

// Solvencias de biblioteca (paz y salvo). Siguen el proceso que la biblioteca publica en su sitio: la persona paga la
// orden de pago de la universidad, llena la solicitud con sus datos y el número de esa orden, el personal la revisa y
// la solvencia se entrega en un horario que depende de cuándo se envió la solicitud.
const MOTIVOS = ['Grado', 'Certificado de paz y salvo', 'Retiro del programa', 'Otro'];

// La solicitud se envía con al menos un día de anticipación a la fecha en que se presentará la papelería, y con un máximo de siete.
const DIAS_MAXIMOS_DE_ANTICIPACION = 7;

const FORMATO_DE_CARNE = /^[0-9A-Za-z-]{5,15}$/;
const FORMATO_DE_CUI = /^\d{13}$/;
const FORMATO_DE_ORDEN_DE_PAGO = /^[0-9A-Za-z-]{4,20}$/;

const estado = almacen.cargar('solvencia', { solicitudes: [], contador: 0 });
const solicitudes = estado.solicitudes;

function guardar() {
  almacen.guardar('solvencia', estado);
}

function siguienteCodigo() {
  estado.contador += 1;
  return `SOL-${String(estado.contador).padStart(3, '0')}`;
}

function kioscoValido(kiosco) {
  return typeof kiosco === 'string' && /^[0-9A-Za-z_-]{1,10}$/.test(kiosco) ? kiosco : null;
}

// Cuándo se entrega la solvencia según la hora en que se envió la solicitud (horarios que publica la biblioteca):
//   de 08:00 a 13:00 -> ese mismo día a las 15:00        de 13:01 a 17:00 -> ese mismo día a las 18:00
//   más tarde, o antes de las 08:00 -> a las 14:00 del siguiente día hábil (si se envía de madrugada, ese mismo día)
// Solo se entrega de lunes a viernes y no en días de asueto, así que los fines de semana y los cierres pasan al siguiente día hábil.
function entregaEstimada(ahora = new Date()) {
  const hoy = fechaLocal(ahora);
  const minutos = minutosDelDia(ahora);
  if (horarios.esDiaHabil(hoy)) {
    if (minutos < 8 * 60) return { fecha: hoy, hora: '14:00' };
    if (minutos <= 13 * 60) return { fecha: hoy, hora: '15:00' };
    if (minutos <= 17 * 60) return { fecha: hoy, hora: '18:00' };
  }
  return { fecha: horarios.siguienteDiaHabil(hoy), hora: '14:00' };
}

function textoObligatorio(valor, nombre, minimo, maximo) {
  const texto = String(valor ?? '').trim().replace(/\s+/g, ' ');
  if (texto.length < minimo || texto.length > maximo) {
    throw rechazo(`${nombre}: escribe entre ${minimo} y ${maximo} caracteres`);
  }
  return texto;
}

function validar({ solicitante, identificacion, cui, programa, motivo, correo, ordenDePago, fechaPapeleria, esEstudiante }, ahora) {
  const nombre = textoObligatorio(solicitante, 'Nombre completo', 3, 80);

  const carne = String(identificacion ?? '').trim();
  if (!FORMATO_DE_CARNE.test(carne)) {
    throw rechazo('Escribe tu número de carné (de 5 a 15 letras o números)');
  }

  const cuiLimpio = String(cui ?? '').replace(/\s+/g, '');
  if (!FORMATO_DE_CUI.test(cuiLimpio)) {
    throw rechazo('El CUI (el número de tu DPI) tiene 13 números');
  }

  const carrera = textoObligatorio(programa, 'Programa académico', 3, 120);
  if (!MOTIVOS.includes(motivo)) {
    throw rechazo('Elige el motivo de la solvencia');
  }

  const correoLimpio = String(correo ?? '').trim();
  if (!correoValido(correoLimpio)) {
    throw rechazo('Escribe un correo válido: ahí recibirás la confirmación y la solvencia');
  }

  const orden = String(ordenDePago ?? '').trim();
  if (!FORMATO_DE_ORDEN_DE_PAGO.test(orden)) {
    throw rechazo('Escribe el número de tu orden de pago (de 4 a 20 letras o números)');
  }

  if (esEstudiante !== true) {
    throw rechazo('Este servicio es para estudiantes de la Facultad de Ciencias Jurídicas y Sociales del Campus Central: confírmalo para continuar');
  }

  const hoy = fechaLocal(ahora);
  if (!esFechaISO(fechaPapeleria)) {
    throw rechazo('Indica la fecha en la que presentarás tu papelería');
  }
  if (fechaPapeleria <= hoy) {
    throw rechazo('La solicitud debe enviarse con al menos un día de anticipación a la fecha en que presentarás tu papelería');
  }
  if (fechaPapeleria > sumarDias(hoy, DIAS_MAXIMOS_DE_ANTICIPACION)) {
    throw rechazo(`Solo puedes solicitar la solvencia con un máximo de ${DIAS_MAXIMOS_DE_ANTICIPACION} días de anticipación`);
  }
  if (!horarios.esDiaHabil(fechaPapeleria)) {
    throw rechazo('Esa fecha no es un día hábil de entrega (las solvencias se entregan de lunes a viernes, salvo asuetos): elige otra');
  }

  return { solicitante: nombre, identificacion: carne.toUpperCase(), cui: cuiLimpio, programa: carrera, motivo, correo: correoLimpio, ordenDePago: orden.toUpperCase(), fechaPapeleria };
}

function crear(datos, ahora = new Date()) {
  const limpios = validar(datos, ahora);
  const solicitud = {
    id: siguienteCodigo(),
    ...limpios,
    ...(kioscoValido(datos.kiosco) ? { kiosco: kioscoValido(datos.kiosco) } : {}),
    codigoConfirmacion: generarCodigoConfirmacion(),
    entregaEstimada: entregaEstimada(ahora),
    estado: 'pendiente',
    creadoEn: ahora.toISOString(),
  };
  solicitudes.push(solicitud);
  guardar();
  return solicitud;
}

function listar() {
  return solicitudes.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

function buscarSolicitud(id) {
  return solicitudes.find((s) => s.id === id) || null;
}

const SIGUIENTE_ESTADO = { pendiente: 'en_revision', en_revision: 'aprobada' };

function avanzarEstado(id) {
  const solicitud = buscarSolicitud(id);
  if (!solicitud) return null;
  const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
  if (!siguiente) return solicitud;
  solicitud.estado = siguiente;
  if (siguiente === 'aprobada') solicitud.atendidaEn = new Date().toISOString();
  guardar();
  return solicitud;
}

// Rechaza una solicitud y deja escrito por qué (por ejemplo, un dato mal escrito: la persona debe enviar otra).
function rechazar(id, observacion) {
  const solicitud = buscarSolicitud(id);
  if (!solicitud) return null;
  const motivo = String(observacion ?? '').trim();
  if (motivo.length < 3 || motivo.length > 500) {
    throw rechazo('Escribe el motivo del rechazo (de 3 a 500 caracteres): la persona lo recibirá por correo');
  }
  solicitud.estado = 'rechazada';
  solicitud.observacion = motivo;
  solicitud.atendidaEn = new Date().toISOString();
  guardar();
  return solicitud;
}

function resumen() {
  return {
    total: solicitudes.length,
    pendientes: solicitudes.filter((s) => s.estado === 'pendiente').length,
  };
}

module.exports = {
  MOTIVOS,
  DIAS_MAXIMOS_DE_ANTICIPACION,
  entregaEstimada,
  crear,
  listar,
  buscarSolicitud,
  avanzarEstado,
  rechazar,
  resumen,
};
