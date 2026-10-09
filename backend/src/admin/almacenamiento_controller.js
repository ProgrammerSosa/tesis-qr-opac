const almacen = require('../../utils/almacen');
const { registrar } = require('../actividad/actividad_data');
const { fechaLocal } = require('../../utils/fechas');
const { ok, fail } = require('../../utils/httpResponse');

// Dónde está guardado todo y un respaldo para descargar (solo el administrador).

async function getAlmacenamiento(req, res) {
  try {
    return ok(res, { ...(await almacen.situacion()), enProduccion: process.env.NODE_ENV === 'production' });
  } catch (error) {
    console.error(`No se pudo consultar el almacenamiento: ${error.message}`);
    return fail(res, 'No se pudo consultar dónde están guardados los datos', 500);
  }
}

// Todos los documentos en un solo archivo JSON. Las cuentas van sin su sal ni su clave cifrada: eso no debe viajar en un archivo.
// Las sesiones abiertas del panel tampoco: no son datos de la biblioteca.
function getRespaldo(req, res) {
  const documentos = almacen.respaldo();
  delete documentos.sesiones;
  if (documentos.cuentas && Array.isArray(documentos.cuentas.cuentas)) {
    documentos.cuentas = { cuentas: documentos.cuentas.cuentas.map(({ sal, hash, ...publica }) => publica) };
  }
  const respaldo = {
    aplicacion: 'biblioteca-opac',
    version: 1,
    generadoEn: new Date().toISOString(),
    almacenamiento: almacen.descripcion(),
    documentos,
  };
  registrar(req.sesion, 'respaldo.descargado', `${Object.keys(documentos).length} documentos`);
  res.set({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="respaldo-biblioteca-${fechaLocal()}.json"`,
    'Cache-Control': 'no-store',
  });
  return res.send(JSON.stringify(respaldo, null, 2));
}

module.exports = { getAlmacenamiento, getRespaldo };
