const correo = require('../../utils/correo');
const notificaciones = require('../notificaciones/notificaciones');
const { registrar } = require('../actividad/actividad_data');
const { correoValido } = require('../../utils/codigos');
const { ok, fail } = require('../../utils/httpResponse');

// Estado del correo y envío de prueba (solo el administrador). Aquí no se configura nada: el correo se configura con las
// variables del servidor (ver backend/.env.example); esta sección deja ver cómo quedó y comprobar que sale.

// Una prueba manda un correo de verdad a la dirección que se escriba: se limita para que no sirva para llenar una bandeja.
const ESPERA_ENTRE_PRUEBAS_MS = 5000;
const ultimaPrueba = new Map(); // usuario -> cuándo hizo la última

function getCorreo(req, res) {
  return ok(res, { ...correo.estado(), recientes: correo.recientes(20) });
}

async function postVerificar(req, res) {
  return ok(res, await correo.verificar());
}

async function postPrueba(req, res) {
  const para = String(req.body?.para ?? '').trim();
  if (!correoValido(para)) {
    return fail(res, 'Escribe un correo válido para enviar la prueba');
  }
  const usuario = req.sesion.usuario;
  if (Date.now() - (ultimaPrueba.get(usuario) ?? 0) < ESPERA_ENTRE_PRUEBAS_MS) {
    return fail(res, 'Espera unos segundos antes de enviar otra prueba', 429);
  }
  ultimaPrueba.set(usuario, Date.now());

  try {
    const mensaje = await correo.enviarCorreo({ para, ...notificaciones.mensajeDePrueba({ quien: req.sesion.nombre || usuario }) });
    registrar(req.sesion, 'correo.prueba', `${para}: ${mensaje.simulado ? 'simulado' : `enviado por ${mensaje.via}`}`);
    return ok(
      res,
      { para, simulado: mensaje.simulado, via: mensaje.via },
      mensaje.simulado ? 'Correo simulado: no salió de verdad' : 'Correo de prueba enviado'
    );
  } catch (error) {
    registrar(req.sesion, 'correo.prueba', `${para}: falló`);
    return fail(res, error.message, 502);
  }
}

module.exports = { getCorreo, postVerificar, postPrueba };
