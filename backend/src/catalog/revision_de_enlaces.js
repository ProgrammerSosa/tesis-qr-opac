const { verificarPendientes, contarVerificaciones } = require('./catalog_data');
const { registrar } = require('../actividad/actividad_data');

// Revisión automática de los enlaces de las tesis: el servidor comprueba solo, de a poco, que la URL de cada tesis siga respondiendo,
// para que un código QR impreso no quede apuntando a un documento que ya no está sin que nadie se entere.
//
//   VERIFICAR_ENLACES_DIAS   cada cuántos días se vuelve a revisar un enlace que estaba bien (7 por defecto; 0 la apaga)
//
// Cada hora revisa una tanda de las tesis a las que les toca: las nuevas o con la URL cambiada, las correctas cada N días y las rotas
// cada día. Va de a un pedido por segundo para no cargar al sitio donde están los documentos. Lo roto se ve en el panel (resumen y
// «Códigos QR») y queda anotado en la actividad. Desde el panel se puede pedir una revisión en el momento.

const HORA_MS = 60 * 60 * 1000;
const POR_PASADA = 200; // a un pedido por segundo, poco más de tres minutos por hora
const TOPE_A_PEDIDO = 2000; // una revisión pedida desde el panel sigue hasta terminar, con este tope

function entero(valor, porDefecto, minimo, maximo) {
  const n = Number(valor);
  return String(valor ?? '').trim() !== '' && Number.isInteger(n) && n >= minimo && n <= maximo ? n : porDefecto;
}

const DIAS = entero(process.env.VERIFICAR_ENLACES_DIAS, 7, 0, 365);
// Existe para las pruebas automáticas: sin espera entre un pedido y otro.
const PAUSA_MS = entero(process.env.VERIFICAR_ENLACES_PAUSA_MS, 1000, 0, 60000);
// Sin revisión automática, lo pedido a mano sigue revisando «cada semana».
const DIAS_AL_REVISAR = DIAS || 7;

let enCurso = false;
let ultimaPasada = null; // { fecha, revisadas, rotas, recuperadas, automatica } de la última desde que se encendió el servidor

const lista = (ids) => (ids.length > 10 ? `${ids.slice(0, 10).join(', ')} y ${ids.length - 10} más` : ids.join(', '));

// Revisa lo que toque. `sesion` es quien la pidió desde el panel (sin ella es la pasada automática de cada hora).
async function pasada({ sesion = null, maximo = POR_PASADA } = {}) {
  if (enCurso) return;
  enCurso = true;
  try {
    const { revisadas, rotas, recuperadas } = await verificarPendientes({ dias: DIAS_AL_REVISAR, maximo, pausaMs: PAUSA_MS });
    ultimaPasada = { fecha: new Date().toISOString(), revisadas, rotas: rotas.length, recuperadas: recuperadas.length, automatica: !sesion };
    // Solo se anota cuando hay novedades: una línea por hora diciendo «todo bien» taparía lo que hace el personal.
    if (rotas.length > 0 || recuperadas.length > 0) {
      const partes = [`${revisadas} enlaces revisados`];
      if (rotas.length > 0) partes.push(`rotos: ${lista(rotas)}`);
      if (recuperadas.length > 0) partes.push(`volvieron a funcionar: ${lista(recuperadas)}`);
      registrar(sesion, 'qr.revision', partes.join('; '));
    }
    if (!sesion && rotas.length > 0) console.warn(`[enlaces] ${rotas.length} enlace${rotas.length === 1 ? '' : 's'} de tesis dejaron de responder: ${lista(rotas)}`);
  } catch (error) {
    console.error(`[enlaces] La revisión de enlaces falló: ${error.message}`);
  } finally {
    enCurso = false;
  }
}

// Revisión pedida desde el panel: arranca y sigue por su cuenta; el panel consulta `situacion` para saber cuándo termina.
function revisarAhora(sesion) {
  if (enCurso) return false;
  pasada({ sesion, maximo: TOPE_A_PEDIDO });
  return true;
}

function situacion() {
  return { activa: DIAS > 0, dias: DIAS, enCurso, ultimaPasada, ...contarVerificaciones(DIAS_AL_REVISAR) };
}

function iniciar() {
  console.log(`  Revisión automática de enlaces: ${DIAS > 0 ? `cada ${DIAS} día${DIAS === 1 ? '' : 's'}` : 'apagada (VERIFICAR_ENLACES_DIAS=0)'}`);
  if (DIAS === 0) return;
  // La primera pasada es poco después de encender (VERIFICAR_ENLACES_PRIMERA_S existe para las pruebas automáticas).
  const primera = setTimeout(() => pasada(), entero(process.env.VERIFICAR_ENLACES_PRIMERA_S, 180, 0, 86400) * 1000);
  primera.unref();
  const reloj = setInterval(() => pasada(), HORA_MS);
  reloj.unref();
}

module.exports = { iniciar, situacion, revisarAhora };
