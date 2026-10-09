const almacen = require('../../utils/almacen');
const correo = require('../../utils/correo');
const biblioteca = require('../../utils/biblioteca');
const { plantilla } = require('../../utils/plantillaCorreo');
const { crearZip } = require('../../utils/zip');
const { correoValido } = require('../../utils/codigos');
const { fechaLocal } = require('../../utils/fechas');
const { rechazo } = require('../../utils/errores');
const { registrar } = require('../actividad/actividad_data');

// Respaldo de todo lo guardado: el que se descarga desde el panel y el que el servidor manda solo por correo cada cierto tiempo.
//
// El automático se configura con variables del servidor (ver backend/.env.example):
//   RESPALDO_CORREO   a qué dirección se manda (sin ella, no hay respaldo automático)
//   RESPALDO_DIAS     cada cuántos días (7 por defecto)
// Sale por el mismo camino que los demás correos (API o SMTP); con el correo simulado no se manda nada.
// Hace falta porque el plan gratuito de Supabase no tiene copias de seguridad que se puedan descargar.

// Lo que no es de la biblioteca sino del funcionamiento del servidor: no entra en los respaldos.
const NO_SE_RESPALDAN = ['sesiones', 'respaldos'];

const DIA_MS = 24 * 60 * 60 * 1000;
const REVISAR_CADA_MS = 60 * 60 * 1000;
const ESPERA_TRAS_UN_FALLO_MS = 6 * 60 * 60 * 1000;
const ESPERA_ENTRE_ENVIOS_A_MANO_MS = 30 * 1000;

const estado = almacen.cargar('respaldos', { ultimo: null, ultimoError: null });
let enCurso = false;
let ultimoAMano = 0;

function guardar() {
  almacen.guardar('respaldos', estado);
}

function entero(valor, porDefecto, minimo, maximo) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= minimo && n <= maximo ? n : porDefecto;
}

// Todos los documentos juntos. Las cuentas van sin su sal ni su clave cifrada: eso no debe viajar en un archivo.
function armar() {
  const documentos = almacen.respaldo();
  NO_SE_RESPALDAN.forEach((nombre) => delete documentos[nombre]);
  if (documentos.cuentas && Array.isArray(documentos.cuentas.cuentas)) {
    documentos.cuentas = { cuentas: documentos.cuentas.cuentas.map(({ sal, hash, ...publica }) => publica) };
  }
  return {
    aplicacion: 'biblioteca-opac',
    version: 1,
    generadoEn: new Date().toISOString(),
    almacenamiento: almacen.descripcion(),
    documentos,
  };
}

const nombreDeArchivo = (extension) => `respaldo-biblioteca-${fechaLocal()}.${extension}`;

function leerConfiguracion() {
  const para = String(process.env.RESPALDO_CORREO || '').trim();
  const dias = entero(process.env.RESPALDO_DIAS, 7, 1, 90);
  let motivo = null;
  if (!para) motivo = 'sin_destino';
  else if (!correoValido(para)) motivo = 'destino_invalido';
  else if (correo.estado().modo === 'simulado') motivo = 'correo_simulado';
  return { para, dias, activo: motivo === null, motivo };
}

// Cuándo toca el próximo envío automático (null si no está activo). Tras un fallo se espera unas horas antes de reintentar.
function proximoEnvio(config = leerConfiguracion()) {
  if (!config.activo) return null;
  const ultimo = estado.ultimo ? Date.parse(estado.ultimo.fecha) : null;
  const fallo = estado.ultimoError ? Date.parse(estado.ultimoError.fecha) : null;
  const porCalendario = ultimo === null ? 0 : ultimo + config.dias * DIA_MS;
  const porFallo = fallo !== null && (ultimo === null || fallo > ultimo) ? fallo + ESPERA_TRAS_UN_FALLO_MS : 0;
  return Math.max(porCalendario, porFallo);
}

// Lo que el panel muestra del respaldo automático.
function situacion() {
  const config = leerConfiguracion();
  const proximo = proximoEnvio(config);
  return {
    activo: config.activo,
    motivo: config.motivo,
    para: config.para || null,
    dias: config.dias,
    ultimo: estado.ultimo,
    ultimoError: estado.ultimoError,
    proximo: proximo === null ? null : new Date(Math.max(proximo, Date.now())).toISOString(),
  };
}

const megas = (bytes) => (bytes / (1024 * 1024)).toFixed(1);

function mensaje(respaldo, archivo, { manual, quien }) {
  const d = respaldo.documentos;
  const cuantos = (lista) => (Array.isArray(lista) ? lista.length : 0);
  const leeme = [
    `Respaldo de ${biblioteca.nombre}`,
    `Generado: ${respaldo.generadoEn}`,
    '',
    `${archivo} lleva todo lo guardado en el sistema: catálogo de tesis con sus códigos QR, reservas, solicitudes de solvencia,`,
    'cuentas del personal (sin sus claves), horarios, configuración, actividad y estadísticas.',
    '',
    'Tiene datos de estudiantes (carné, CUI y correo): guárdalo en un lugar seguro y no lo reenvíes.',
    '',
    'Para restaurarlo: apaga el servidor, y en la carpeta backend corre',
    `  npm run importar -- ruta/al/${archivo} --forzar`,
    '(también acepta este .zip tal cual). Después vuelve a encender el servidor. Las cuentas del personal no se restauran: las',
    'iniciales se crean con las claves CLAVE_* del servidor y las demás se vuelven a crear desde el panel.',
  ].join('\n');
  return {
    leeme,
    ...plantilla({
      titulo: 'Respaldo de los datos de la biblioteca',
      previa: 'Copia de todo lo guardado, por si hiciera falta restaurarlo.',
      filas: [
        ['Generado', new Date(respaldo.generadoEn).toLocaleString('es-GT')],
        ['Envío', manual ? `A mano, por ${quien}` : 'Automático'],
        ['Tesis en el catálogo', cuantos(d.catalogo?.tesis)],
        ['Reservas', cuantos(d.reservas?.reservas)],
        ['Solicitudes de solvencia', cuantos(d.solvencia?.solicitudes)],
        ['Guardado en', respaldo.almacenamiento],
      ],
      parrafos: [
        'El archivo adjunto (.zip) lleva todo lo guardado en el sistema, sin las claves de las cuentas. Consérvalo: es la copia para restaurar los datos si se perdieran.',
        'Tiene datos de estudiantes (carné, CUI y correo): guárdalo en un lugar seguro y no lo reenvíes. Dentro del .zip hay un archivo LEEME.txt que explica cómo restaurarlo.',
      ],
    }),
  };
}

// Arma el respaldo y lo manda por correo a RESPALDO_CORREO. `sesion` es quien lo pidió desde el panel (sin ella es el envío automático).
// Devuelve { para, bytes, simulado, via }; si no se puede, lanza el error con un mensaje para mostrar.
async function enviar({ sesion = null } = {}) {
  const config = leerConfiguracion();
  if (config.motivo === 'sin_destino') throw rechazo('Falta RESPALDO_CORREO en el servidor: ahí se escribe a qué correo mandar el respaldo', 409);
  if (config.motivo === 'destino_invalido') throw rechazo('RESPALDO_CORREO no es un correo válido', 409);
  if (enCurso) throw rechazo('Ya se está enviando un respaldo. Espera un momento', 409);

  enCurso = true;
  const manual = Boolean(sesion);
  try {
    const respaldo = armar();
    const json = nombreDeArchivo('json');
    const { leeme, texto, html } = mensaje(respaldo, json, { manual, quien: sesion?.nombre || sesion?.usuario });
    const zip = crearZip([
      { nombre: json, contenido: JSON.stringify(respaldo, null, 2) },
      { nombre: 'LEEME.txt', contenido: leeme },
    ]);
    const maximo = entero(process.env.RESPALDO_MAX_MB, 15, 1, 40) * 1024 * 1024;
    if (zip.length > maximo) {
      throw new Error(`El respaldo pesa ${megas(zip.length)} MB y no cabe en un correo (máximo ${megas(maximo)} MB): descárgalo desde el panel.`);
    }
    const enviado = await correo.enviarCorreo({
      para: config.para,
      tipo: 'respaldo',
      asunto: `Respaldo de la biblioteca · ${fechaLocal()}`,
      texto,
      html,
      adjuntos: [{ nombre: nombreDeArchivo('zip'), contenido: zip, tipo: 'application/zip' }],
    });
    const resultado = { para: config.para, bytes: zip.length, simulado: enviado.simulado, via: enviado.via };
    if (!enviado.simulado) {
      // Solo un envío de verdad cuenta como respaldo hecho.
      estado.ultimo = { fecha: new Date().toISOString(), para: config.para, bytes: zip.length, via: enviado.via, manual };
      estado.ultimoError = null;
      guardar();
    }
    registrar(sesion, 'respaldo.enviado', `${config.para}: ${enviado.simulado ? 'simulado (no salió)' : `${megas(zip.length)} MB por ${enviado.via}`}`);
    return resultado;
  } catch (error) {
    estado.ultimoError = { fecha: new Date().toISOString(), mensaje: error.message };
    guardar();
    registrar(sesion, 'respaldo.fallido', error.message.slice(0, 200));
    throw error;
  } finally {
    enCurso = false;
  }
}

// Envío pedido desde el panel: uno cada medio minuto como mucho.
async function enviarAMano(sesion) {
  if (Date.now() - ultimoAMano < ESPERA_ENTRE_ENVIOS_A_MANO_MS) throw rechazo('Espera medio minuto antes de enviar otro respaldo', 429);
  ultimoAMano = Date.now();
  return enviar({ sesion });
}

async function revisar() {
  const proximo = proximoEnvio();
  if (proximo === null || enCurso || Date.now() < proximo) return;
  try {
    const { para, bytes } = await enviar();
    console.log(`[respaldo] Enviado a ${para} (${megas(bytes)} MB)`);
  } catch (error) {
    console.error(`[respaldo] No se pudo enviar el respaldo automático: ${error.message}`);
  }
}

const EXPLICACION = {
  sin_destino: 'apagado (define RESPALDO_CORREO para recibirlo por correo)',
  destino_invalido: 'apagado: RESPALDO_CORREO no es un correo válido',
  correo_simulado: 'apagado: el correo está en modo simulado, así que no saldría (configura el correo)',
};

// Arranca la revisión periódica. La primera es poco después de encender, para no esperar una hora tras cada publicación.
function iniciar() {
  const config = leerConfiguracion();
  console.log(`  Respaldo automático: ${config.activo ? `cada ${config.dias} día${config.dias === 1 ? '' : 's'} a ${config.para}` : EXPLICACION[config.motivo]}`);
  // RESPALDO_PRIMERA_REVISION_S existe para las pruebas automáticas.
  const primera = setTimeout(revisar, entero(process.env.RESPALDO_PRIMERA_REVISION_S, 120, 0, 3600) * 1000);
  primera.unref();
  const reloj = setInterval(revisar, REVISAR_CADA_MS);
  reloj.unref();
}

module.exports = { armar, nombreDeArchivo, situacion, enviarAMano, iniciar, NO_SE_RESPALDAN };
