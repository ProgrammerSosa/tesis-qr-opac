const { buscarTesis, obtenerPorId, tesisRelacionadas, digitalDisponible, destinoEfectivoDelQr, vistaPublica } = require('./catalog_data');
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
async function getDocumento(req, res) {
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
  try {
    // La ficha de la tesis en este mismo sitio, para que el PDF la enlace.
    const pdf = await pdfDeTesis(tesis, acceso, { enlace: `${req.protocol}://${req.get('host')}/tesis/${encodeURIComponent(tesis.id)}` });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${descargar ? 'attachment' : 'inline'}; filename="${tesis.id}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    console.error(error);
    return fail(res, 'No se pudo preparar el documento', 500);
  }
}

// Enlace corto del código QR (/r/<código>): lo que va impreso en la etiqueta cuando el destino es «enlace». Abre la URL de la tesis
// que esté guardada en ese momento, así que cambiarla no obliga a reimprimir, y cuenta el escaneo. Si la tesis no tiene URL que
// ofrecer (o su código está desactivado, o ya no existe) lleva a su ficha, que explica qué pasa.
function getEnlaceCorto(req, res, { contar = true } = {}) {
  const id = String(req.params.id);
  const tesis = obtenerPorId(id);
  // Sin memoria intermedia: cada escaneo debe llegar hasta aquí para contarse y para tomar la URL vigente.
  res.set('Cache-Control', 'no-store');
  if (!tesis || destinoEfectivoDelQr(tesis) === 'ficha') {
    return res.redirect(`/tesis/${encodeURIComponent(id)}?origen=qr`);
  }
  if (contar) {
    registrar('acceso_qr', { tesisId: tesis.id });
    registrar('consulta_digital', { tesisId: tesis.id });
  }
  return res.redirect(tesis.documentoDigital.urlExterna);
}

module.exports = { listItems, getItem, getDocumento, getEnlaceCorto };
