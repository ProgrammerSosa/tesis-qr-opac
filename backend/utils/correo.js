// Envío de correos del sistema (confirmaciones, avisos de solvencias, tesis y referencias).
//
// Si el servidor tiene configurado el correo (variable SMTP_HOST y las que la acompañan, ver .env.example), los
// mensajes salen de verdad. Si no, se arman completos y se guardan en una bandeja simulada, y así todo funciona igual
// en pruebas y demostraciones sin mandar correos reales.
const biblioteca = require('./biblioteca');

const MAXIMO_EN_BANDEJA = 200;
const bandeja = []; // últimos correos "enviados" (reales o simulados), el más reciente primero

let transporte; // undefined = aún no se ha decidido; null = sin SMTP configurado

function obtenerTransporte() {
  if (transporte !== undefined) return transporte;
  if (!process.env.SMTP_HOST) {
    transporte = null;
    return transporte;
  }
  // nodemailer solo se carga si hay correo configurado.
  const nodemailer = require('nodemailer');
  const puerto = Number(process.env.SMTP_PORT) || 587;
  transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: puerto,
    secure: puerto === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporte;
}

function remitente() {
  return process.env.SMTP_FROM || `"${biblioteca.nombre}" <${process.env.SMTP_USER || 'no-responder@localhost'}>`;
}

// Envía un correo de texto. Devuelve el mensaje con `simulado: true` si no salió de verdad.
// Si el envío real falla, lanza el error: quien llama decide si avisar a la persona o seguir.
async function enviarCorreo({ para, asunto, texto }) {
  const smtp = obtenerTransporte();
  const mensaje = { para, asunto, cuerpo: texto, enviadoEn: new Date().toISOString(), simulado: !smtp };
  if (smtp) {
    await smtp.sendMail({ from: remitente(), to: para, subject: asunto, text: texto });
  }
  bandeja.unshift(mensaje);
  if (bandeja.length > MAXIMO_EN_BANDEJA) bandeja.length = MAXIMO_EN_BANDEJA;
  return mensaje;
}

// Para avisos que no deben detener lo que se estaba haciendo: si el correo falla, se anota en la consola y se sigue.
async function avisarPorCorreo(datos) {
  if (!datos.para) return null;
  try {
    return await enviarCorreo(datos);
  } catch (error) {
    console.error(`No se pudo enviar el correo "${datos.asunto}" a ${datos.para}: ${error.message}`);
    return null;
  }
}

function correoConfigurado() {
  return Boolean(process.env.SMTP_HOST);
}

module.exports = { enviarCorreo, avisarPorCorreo, correoConfigurado, bandeja };
