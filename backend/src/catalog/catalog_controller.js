const { buscarTesis, obtenerPorId, tesisRelacionadas, digitalDisponible, vistaPublica } = require('./catalog_data');
const { pdfDeTesis } = require('./pdf_ejemplo');
const { registrar } = require('../eventos/eventos_data');
const { ok, fail, notFound } = require('../../utils/httpResponse');

function listItems(req, res) {
  const { autor, titulo, anio, tema, tipo, digital } = req.query;
  const registros = buscarTesis({ autor, titulo, anio, tema, tipo, digital });
  return ok(res, registros.map(vistaPublica));
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
