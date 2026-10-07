const {
  ACCESOS,
  TESIS,
  digitalDisponible,
  listarParaAdmin,
  obtenerPorId,
  actualizarDocumento,
  actualizarQr,
  verificarQr,
  crearTesis,
  actualizarTesis,
  eliminarTesis,
  importarTesis,
} = require('../catalog/catalog_data');
const reservasData = require('../reservas/reservas_data');
const solvenciaData = require('../solvencia/solvencia_data');
const tramitesData = require('../tramites/tramites_data');
const { registrar } = require('../actividad/actividad_data');
const { calcular } = require('./estadisticas');
const { bandeja, correoConfigurado } = require('../../utils/correo');
const { ok, fail, notFound } = require('../../utils/httpResponse');

const TEXTO_DE_ACCESO = { acceso_descarga: 'acceso y descarga', consulta: 'consulta digital', sin_acceso: 'sin acceso digital' };
const TEXTO_DE_VERIFICACION = { ok: 'enlace correcto', solo_ficha: 'lleva a la ficha', enlace_roto: 'enlace roto' };

// Qué cambió en el documento digital de una tesis, para la bitácora.
function describirDocumento(antes, despues) {
  const cambios = [];
  if (antes.acceso !== despues.acceso) {
    cambios.push(`acceso ${TEXTO_DE_ACCESO[antes.acceso]} → ${TEXTO_DE_ACCESO[despues.acceso]}`);
  }
  if (antes.activo !== despues.activo) {
    cambios.push(despues.activo ? 'documento activado' : 'documento desactivado');
  }
  if ((antes.urlExterna || null) !== (despues.urlExterna || null)) {
    cambios.push(despues.urlExterna ? 'enlace actualizado' : 'enlace quitado');
  }
  return cambios.length > 0 ? cambios.join(', ') : 'sin cambios';
}

function getResumen(req, res) {
  return ok(res, {
    tesis: { total: TESIS.length, conDocumentoDigital: TESIS.filter(digitalDisponible).length },
    reservas: reservasData.resumen(),
    solvencia: solvenciaData.resumen(),
    tramites: tramitesData.resumen(),
  });
}

// Operaciones de cada persona (reservas y solicitudes), agrupadas por su carné o documento.
function getUsuarios(req, res) {
  const q = String(req.query.q || '').trim().toLowerCase();
  const porPersona = new Map();

  const agregar = (identificacion, nombre, operacion) => {
    const clave = String(identificacion).trim().toLowerCase();
    if (!porPersona.has(clave)) {
      porPersona.set(clave, { identificacion: String(identificacion).trim(), nombre, operaciones: [] });
    }
    porPersona.get(clave).operaciones.push(operacion);
  };

  reservasData.listarReservas().forEach((r) =>
    agregar(r.identificacion, r.solicitante, {
      tipo: 'reserva',
      id: r.id,
      detalle: `${r.recursoNombre} · ${r.fecha} de ${r.hora} a ${r.horaFin}`,
      estado: r.estado,
      creadoEn: r.creadoEn,
    })
  );
  solvenciaData.listar().forEach((s) =>
    agregar(s.identificacion, s.solicitante, {
      tipo: 'solvencia',
      id: s.id,
      detalle: s.motivo,
      estado: s.estado,
      creadoEn: s.creadoEn,
    })
  );
  // Las solicitudes de tesis y de referencias solo cuentan si la persona dejó su carné o documento.
  tramitesData
    .listar()
    .filter((t) => t.identificacion)
    .forEach((t) =>
      agregar(t.identificacion, t.solicitante, {
        tipo: t.tipo,
        id: t.id,
        detalle: t.tipo === 'tesis_digital' ? t.titulo : t.tema,
        estado: t.estado,
        creadoEn: t.creadoEn,
      })
    );

  const personas = [...porPersona.values()]
    .map((p) => {
      const operaciones = p.operaciones.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
      return {
        ...p,
        operaciones,
        totalReservas: operaciones.filter((o) => o.tipo === 'reserva').length,
        totalSolicitudes: operaciones.filter((o) => o.tipo !== 'reserva').length,
        ultimaActividad: operaciones[0].creadoEn,
      };
    })
    .filter((p) => !q || p.identificacion.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
    .sort((a, b) => b.ultimaActividad.localeCompare(a.ultimaActividad));

  return ok(res, personas);
}

// Tesis con su documento digital y su código QR, para que el personal de tesis los gestione.
// Con búsqueda (q), filtro por documento (con o sin) y por páginas.
function getTesis(req, res) {
  const { q, pagina, porPagina, documento } = req.query;
  return ok(res, listarParaAdmin({ q, pagina, porPagina, documento }));
}

// --- Catálogo: alta, cambios, baja e importación ---

function postTesis(req, res) {
  try {
    const tesis = crearTesis(req.body);
    registrar(req.sesion, 'catalogo.creada', `${tesis.id}: ${tesis.titulo}`);
    return ok(res, tesis, 'Tesis agregada', 201);
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function patchTesis(req, res) {
  try {
    const tesis = actualizarTesis(req.params.id, req.body);
    if (!tesis) return notFound(res, 'Tesis no encontrada');
    registrar(req.sesion, 'catalogo.actualizada', `${tesis.id}: ${tesis.titulo}`);
    return ok(res, tesis, 'Tesis actualizada');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function deleteTesis(req, res) {
  const tesis = eliminarTesis(req.params.id);
  if (!tesis) return notFound(res, 'Tesis no encontrada');
  registrar(req.sesion, 'catalogo.eliminada', `${tesis.id}: ${tesis.titulo}`);
  return ok(res, { eliminada: true });
}

// Importa filas del catálogo. Vaciar el catálogo antes de importar solo lo puede pedir el administrador.
function postImportar(req, res) {
  try {
    const { filas, existentes, reemplazar } = req.body;
    if (reemplazar === true && req.sesion.rol !== 'administrador') {
      return fail(res, 'Solo el administrador puede reemplazar todo el catálogo', 403);
    }
    const resultado = importarTesis(filas, { existentes, reemplazar: reemplazar === true });
    registrar(
      req.sesion,
      'catalogo.importado',
      `${resultado.creadas} nuevas, ${resultado.actualizadas} actualizadas, ${resultado.omitidas} omitidas, ${resultado.totalErrores} con errores${reemplazar === true ? ' (reemplazó el catálogo)' : ''}`
    );
    return ok(res, resultado, 'Importación terminada');
  } catch (err) {
    return fail(res, err.message, err.estado || 500);
  }
}

function patchDocumento(req, res) {
  const { acceso, activo, urlExterna } = req.body;
  if (acceso !== undefined && !ACCESOS.includes(acceso)) {
    return fail(res, 'Nivel de acceso invalido');
  }
  if (urlExterna && !/^https?:\/\/\S+$/i.test(urlExterna)) {
    return fail(res, 'El enlace debe empezar con http:// o https://');
  }
  const existente = obtenerPorId(req.params.id);
  const documentoAntes = existente ? { ...existente.documentoDigital } : null;
  const tesis = actualizarDocumento(req.params.id, { acceso, activo, urlExterna });
  if (!tesis) return notFound(res, 'Tesis no encontrada');
  registrar(req.sesion, 'tesis.documento', `${tesis.id}: ${describirDocumento(documentoAntes, tesis.documentoDigital)}`);
  return ok(res, tesis);
}

function patchQr(req, res) {
  if (typeof req.body.activo !== 'boolean') {
    return fail(res, 'Indica si el código QR queda activo o no');
  }
  const tesis = actualizarQr(req.params.id, { activo: req.body.activo });
  if (!tesis) return notFound(res, 'Tesis no encontrada');
  registrar(req.sesion, 'qr.estado', `${tesis.id}: código ${tesis.qr.activo ? 'activado' : 'desactivado'}`);
  return ok(res, tesis);
}

async function postVerificarQr(req, res) {
  const tesis = await verificarQr(req.params.id);
  if (!tesis) return notFound(res, 'Tesis no encontrada');
  registrar(req.sesion, 'qr.verificado', `${tesis.id}: ${TEXTO_DE_VERIFICACION[tesis.qr.resultado]}`);
  return ok(res, tesis);
}

function getEstadisticas(req, res) {
  return ok(res, calcular());
}

// Los últimos correos que mandó el sistema (reales o simulados), para comprobar que los avisos salen bien.
function getCorreos(req, res) {
  return ok(res, { configurado: correoConfigurado(), correos: bandeja.slice(0, 50) });
}

module.exports = {
  getResumen,
  getCorreos,
  getUsuarios,
  getTesis,
  postTesis,
  patchTesis,
  deleteTesis,
  postImportar,
  patchDocumento,
  patchQr,
  postVerificarQr,
  getEstadisticas,
};
