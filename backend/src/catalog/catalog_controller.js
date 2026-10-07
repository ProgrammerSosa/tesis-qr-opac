const { buscarTesis, obtenerPorId, tesisRelacionadas, digitalDisponible, vistaPublica } = require('./catalog_data');
const { pdfDeTesis } = require('./pdf_ejemplo');
const { registrar } = require('../eventos/eventos_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

// Resultados de la búsqueda, por páginas (el catálogo real tiene miles de tesis): 20 por página, hasta 100.
function listItems(req, res) {
  const { autor, titulo, anio, tema, tipo, digital, pagina, porPagina } = req.query;
  const registros = buscarTesis({ autor, titulo, anio, tema, tipo, digital });
  const tamano = Math.min(Math.max(Number(porPagina) || 20, 1), 100);
  const paginas = Math.max(Math.ceil(registros.length / tamano), 1);
  const actual = Math.min(Math.max(Number(pagina) || 1, 1), paginas);
  return ok(res, {
    items: registros.slice((actual - 1) * tamano, actual * tamano).map(vistaPublica),
    total: registros.length,
    pagina: actual,
    porPagina: tamano,
    paginas,
  });
}

function getItem(req, res) {
  const tesis = obtenerPorId(req.params.id);
  if (!tesis) {
    return notFound(res, 'Tesis no encontrada');
  }
  return ok(res, { ...vistaPublica(tesis), relacionadas: tesisRelacionadas(tesis).map(vistaPublica) });
}

// Entrega el documento digital de una tesis, respetando su nivel de acceso:
// "consulta" solo se muestra en línea; "acceso_descarga" también se puede descargar.
function getDocumento(req, res) {
  const tesis = obtenerPorId(req.params.id);
  if (!tesis) {
    return notFound(res, 'Tesis no encontrada');
  }
  if (!digitalDisponible(tesis)) {
    return fail(res, 'Esta tesis no tiene documento digital disponible', 403);
  }

  const descargar = req.query.descargar === '1';
  const { acceso, urlExterna } = tesis.documentoDigital;
  if (descargar && acceso !== 'acceso_descarga') {
    return fail(res, 'Este documento solo se puede consultar en línea', 403);
  }

  registrar(descargar ? 'descarga_digital' : 'consulta_digital', { kiosco: req.query.kiosco, tesisId: tesis.id });

  if (urlExterna) {
    return res.redirect(urlExterna);
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${descargar ? 'attachment' : 'inline'}; filename="${tesis.id}.pdf"`);
  return res.send(pdfDeTesis(tesis, acceso));
}

module.exports = { listItems, getItem, getDocumento };
