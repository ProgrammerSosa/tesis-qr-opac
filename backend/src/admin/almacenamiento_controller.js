const almacen = require('../../utils/almacen');
const respaldo = require('../respaldo/respaldo_data');
const { registrar } = require('../actividad/actividad_data');
const { ok, fail } = require('../../utils/httpResponse');

// Dónde está guardado todo, un respaldo para descargar y el respaldo que el servidor manda por correo (solo el administrador).

async function getAlmacenamiento(req, res) {
  try {
    return ok(res, { ...(await almacen.situacion()), enProduccion: process.env.NODE_ENV === 'production', respaldoAutomatico: respaldo.situacion() });
  } catch (error) {
    console.error(`No se pudo consultar el almacenamiento: ${error.message}`);
    return fail(res, 'No se pudo consultar dónde están guardados los datos', 500);
  }
}

// Todos los documentos en un solo archivo JSON (sin las claves de las cuentas ni las sesiones abiertas: ver respaldo_data).
function getRespaldo(req, res) {
  const contenido = respaldo.armar();
  registrar(req.sesion, 'respaldo.descargado', `${Object.keys(contenido.documentos).length} documentos`);
  res.set({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="${respaldo.nombreDeArchivo('json')}"`,
    'Cache-Control': 'no-store',
  });
  return res.send(JSON.stringify(contenido, null, 2));
}

// Manda ahora el respaldo al correo configurado en el servidor (RESPALDO_CORREO): sirve para comprobar que llega.
async function postEnviarRespaldo(req, res) {
  try {
    const enviado = await respaldo.enviarAMano(req.sesion);
    return ok(res, enviado, enviado.simulado ? 'Correo simulado: el respaldo no salió de verdad' : `Respaldo enviado a ${enviado.para}`);
  } catch (error) {
    return fail(res, error.message, error.estado || 502);
  }
}

module.exports = { getAlmacenamiento, getRespaldo, postEnviarRespaldo };
