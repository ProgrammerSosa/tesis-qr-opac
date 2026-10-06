const {
  ACCESOS,
  TESIS,
  digitalDisponible,
  listarParaAdmin,
  actualizarDocumento,
  actualizarQr,
  verificarQr,
} = require('../catalog/catalog_data');
const reservasData = require('../reservas/reservas_data');
const solvenciaData = require('../solvencia/solvencia_data');
const { calcular } = require('./estadisticas');
const { ok, fail, notFound } = require('../../utils/httpResponse');

function getResumen(req, res) {
  return ok(res, {
    tesis: { total: TESIS.length, conDocumentoDigital: TESIS.filter(digitalDisponible).length },
    reservas: reservasData.resumen(),
    solvencia: solvenciaData.resumen(),
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

  const personas = [...porPersona.values()]
    .map((p) => {
      const operaciones = p.operaciones.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
      return {
        ...p,
        operaciones,
        totalReservas: operaciones.filter((o) => o.tipo === 'reserva').length,
        totalSolicitudes: operaciones.filter((o) => o.tipo === 'solvencia').length,
        ultimaActividad: operaciones[0].creadoEn,
      };
    })
    .filter((p) => !q || p.identificacion.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
    .sort((a, b) => b.ultimaActividad.localeCompare(a.ultimaActividad));

  return ok(res, personas);
}

// Tesis con su documento digital y su código QR, para que el personal de tesis los gestione.
function getTesis(req, res) {
  return ok(res, listarParaAdmin());
}

function patchDocumento(req, res) {
  const { acceso, activo, urlExterna } = req.body;
  if (acceso !== undefined && !ACCESOS.includes(acceso)) {
    return fail(res, 'Nivel de acceso invalido');
  }
  if (urlExterna && !/^https?:\/\/\S+$/i.test(urlExterna)) {
    return fail(res, 'El enlace debe empezar con http:// o https://');
  }
  const tesis = actualizarDocumento(req.params.id, { acceso, activo, urlExterna });
  if (!tesis) return notFound(res, 'Tesis no encontrada');
  return ok(res, tesis);
}

function patchQr(req, res) {
  if (typeof req.body.activo !== 'boolean') {
    return fail(res, 'Indica si el código QR queda activo o no');
  }
  const tesis = actualizarQr(req.params.id, { activo: req.body.activo });
  if (!tesis) return notFound(res, 'Tesis no encontrada');
  return ok(res, tesis);
}

async function postVerificarQr(req, res) {
  const tesis = await verificarQr(req.params.id);
  if (!tesis) return notFound(res, 'Tesis no encontrada');
  return ok(res, tesis);
}

function getEstadisticas(req, res) {
  return ok(res, calcular());
}

module.exports = { getResumen, getUsuarios, getTesis, patchDocumento, patchQr, postVerificarQr, getEstadisticas };
