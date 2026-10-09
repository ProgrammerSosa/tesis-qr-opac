// Respaldo automático por correo: cuándo sale, qué lleva y qué pasa cuando no se puede. El correo va a una API falsa en esta computadora.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { arrancarServidor, carpetaTemporal, cliente, comprobador, pausa, puertoLibre } from './servidor.mjs';

const require = createRequire(import.meta.url);
const { leerZip } = require('../utils/zip.js');
const { ok, terminar } = comprobador();
const DESTINO = 'direccion@biblioteca.test';

// Una API de correo falsa (con la forma de la de Brevo): anota lo que recibe y responde lo que se le diga.
async function apiFalsa() {
  const recibidos = [];
  const comportamiento = { estado: 201 };
  const servidor = http.createServer((req, res) => {
    let texto = '';
    req.on('data', (d) => (texto += d));
    req.on('end', () => {
      recibidos.push(JSON.parse(texto));
      res.writeHead(comportamiento.estado, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(comportamiento.estado < 300 ? { messageId: 'x' } : { message: 'fallo de prueba' }));
    });
  });
  const puerto = await puertoLibre();
  await new Promise((r) => servidor.listen(puerto, '127.0.0.1', r));
  return { recibidos, comportamiento, url: `http://127.0.0.1:${puerto}/v3/smtp/email`, parar: () => new Promise((r) => servidor.close(r)) };
}

async function esperar(condicion, ms = 6000) {
  for (let i = 0; i < ms / 100; i += 1) {
    if (condicion()) return true;
    await pausa(100);
  }
  return condicion();
}

const api = await apiFalsa();
const CON_CORREO = { CORREO_API: 'brevo', CORREO_API_KEY: 'clave-de-prueba', CORREO_REMITENTE: 'biblioteca@prueba.test', CORREO_API_URL: api.url };
const AUTOMATICO = { ...CON_CORREO, RESPALDO_CORREO: DESTINO, RESPALDO_PRIMERA_REVISION_S: '1' };

async function conServidor(datos, env, prueba) {
  const servidor = await arrancarServidor({ datos, env });
  try {
    const c = cliente(servidor.base);
    const admin = await c.entrar('admin');
    const situacion = async () => (await c.api('GET', '/admin/almacenamiento', { token: admin })).datos.respaldoAutomatico;
    return await prueba({ ...c, admin, situacion, servidor });
  } finally {
    await pausa(700);
    await servidor.parar();
  }
}

const datos = carpetaTemporal('respaldo');
const conFallo = carpetaTemporal('respaldo-fallo');
try {
  console.log('Sin RESPALDO_CORREO no hay respaldo automático');
  await conServidor(datos, { ...CON_CORREO, RESPALDO_PRIMERA_REVISION_S: '1' }, async ({ api: llamar, entrar, admin, situacion, servidor }) => {
    const s = await situacion();
    ok(s.activo === false && s.motivo === 'sin_destino' && s.proximo === null, `el panel dice que está apagado (${s.motivo})`);
    const r = await llamar('POST', '/admin/respaldo/enviar', { token: admin });
    ok(r.estado === 409 && /RESPALDO_CORREO/.test(r.error), `enviar a mano explica qué falta (${r.estado})`);
    ok((await llamar('POST', '/admin/respaldo/enviar', { token: await entrar('tesis') })).estado === 403, 'solo el administrador puede enviarlo');
    await pausa(2000);
    ok(api.recibidos.length === 0, 'no sale ningún correo');
    ok(/Respaldo automático: apagado/.test(servidor.consola()), 'la consola lo dice al arrancar');
  });

  console.log('Con el correo simulado tampoco');
  await conServidor(datos, { RESPALDO_CORREO: DESTINO, RESPALDO_PRIMERA_REVISION_S: '1' }, async ({ api: llamar, admin, situacion }) => {
    ok((await situacion()).motivo === 'correo_simulado', 'el panel dice que el correo está simulado');
    await pausa(2000);
    const r = await llamar('POST', '/admin/respaldo/enviar', { token: admin });
    ok(r.estado === 200 && r.datos.simulado === true, 'a mano se puede probar, y dice que fue simulado');
    ok((await situacion()).ultimo === null, 'un envío simulado no cuenta como respaldo hecho');
  });
  await conServidor(datos, { ...CON_CORREO, RESPALDO_CORREO: 'esto no es un correo' }, async ({ situacion }) => {
    ok((await situacion()).motivo === 'destino_invalido', 'una dirección mal escrita se avisa');
  });

  console.log('Con todo configurado sale solo al poco de arrancar');
  await conServidor(datos, AUTOMATICO, async ({ api: llamar, admin, situacion, servidor }) => {
    ok(await esperar(() => api.recibidos.length === 1), 'llega un correo sin que nadie lo pida');
    const correo = api.recibidos[0];
    ok(correo.to?.[0]?.email === DESTINO, `va a la dirección configurada (${correo.to?.[0]?.email})`);
    ok(/Respaldo de la biblioteca/.test(correo.subject) && /LEEME/.test(correo.textContent), 'con un asunto y un texto que lo explican');
    const adjunto = correo.attachment?.[0];
    ok(correo.attachment?.length === 1 && /^respaldo-biblioteca-\d{4}-\d{2}-\d{2}\.zip$/.test(adjunto?.name ?? ''), `lleva un .zip adjunto (${adjunto?.name})`);
    const archivos = leerZip(Buffer.from(adjunto.content, 'base64'));
    ok(archivos.map((a) => a.nombre).join() === `${adjunto.name.replace('.zip', '.json')},LEEME.txt`, `con el respaldo y un LEEME (${archivos.map((a) => a.nombre).join()})`);
    const respaldo = JSON.parse(archivos[0].contenido.toString('utf8'));
    ok(respaldo.aplicacion === 'biblioteca-opac' && respaldo.documentos.catalogo.tesis.length === 7, 'el respaldo trae el catálogo completo');
    ok(respaldo.documentos.cuentas.cuentas.length === 4 && respaldo.documentos.cuentas.cuentas.every((c) => c.hash === undefined && c.sal === undefined), 'las cuentas van sin sus claves');
    ok(respaldo.documentos.sesiones === undefined && respaldo.documentos.respaldos === undefined, 'no lleva las sesiones ni el registro de respaldos');
    ok(/npm run importar/.test(archivos[1].contenido.toString('utf8')), 'el LEEME dice cómo restaurarlo');

    const s = await situacion();
    ok(s.activo === true && s.para === DESTINO && s.dias === 7, 'el panel dice que está activo, a quién y cada cuánto');
    ok(s.ultimo?.para === DESTINO && s.ultimo.manual === false && s.ultimo.bytes > 500 && s.ultimoError === null, 'y cuándo salió el último');
    const dias = (Date.parse(s.proximo) - Date.now()) / 86400000;
    ok(dias > 6.9 && dias <= 7, `el próximo es en 7 días (${dias.toFixed(2)})`);
    const actividad = (await llamar('GET', '/admin/actividad?limite=50', { token: admin })).datos.registros;
    ok(actividad.some((r) => r.accion === 'respaldo.enviado' && r.usuario === 'sistema'), 'queda anotado en la actividad como hecho por el sistema');
    ok(/\[respaldo\] Enviado a/.test(servidor.consola()) && /Respaldo automático: cada 7 días a/.test(servidor.consola()), 'y en la consola');

    const descarga = await (await fetch(`${servidor.base}/api/admin/respaldo`, { headers: { Authorization: `Bearer ${admin}` } })).json();
    ok(descarga.documentos.catalogo && descarga.documentos.respaldos === undefined && descarga.documentos.sesiones === undefined, 'el respaldo que se descarga tampoco lleva lo del servidor');
  });

  console.log('No se repite hasta que toque');
  await conServidor(datos, AUTOMATICO, async () => {
    await pausa(2500);
    ok(api.recibidos.length === 1, 'tras reiniciar no manda otro: el anterior es reciente');
  });
  const guardado = JSON.parse(fs.readFileSync(path.join(datos, 'respaldos.json'), 'utf8'));
  guardado.ultimo.fecha = new Date(Date.now() - 8 * 86400000).toISOString();
  fs.writeFileSync(path.join(datos, 'respaldos.json'), JSON.stringify(guardado));
  await conServidor(datos, AUTOMATICO, async ({ api: llamar, admin, situacion }) => {
    ok(await esperar(() => api.recibidos.length === 2), 'cuando pasan más de 7 días, manda otro');

    console.log('Enviar a mano desde el panel');
    const r = await llamar('POST', '/admin/respaldo/enviar', { token: admin });
    ok(r.estado === 200 && r.datos.para === DESTINO && r.datos.simulado === false, `sale enseguida (${r.estado})`);
    ok(api.recibidos.length === 3 && /A mano, por/.test(api.recibidos[2].textContent), 'y el correo dice quién lo pidió');
    ok((await situacion()).ultimo.manual === true, 'cuenta como el último respaldo');
    ok((await llamar('POST', '/admin/respaldo/enviar', { token: admin })).estado === 429, 'no se pueden pedir dos seguidos');
  });
  await conServidor(datos, { ...AUTOMATICO, RESPALDO_DIAS: '1' }, async ({ situacion }) => {
    const s = await situacion();
    ok(s.dias === 1 && (Date.parse(s.proximo) - Date.now()) / 86400000 <= 1, 'RESPALDO_DIAS cambia cada cuánto');
  });

  console.log('Si el servicio de correo falla');
  api.comportamiento.estado = 500;
  const antes = api.recibidos.length;
  await conServidor(conFallo, AUTOMATICO, async ({ api: llamar, admin, situacion, servidor }) => {
    ok(await esperar(() => api.recibidos.length === antes + 1), 'lo intenta');
    await pausa(600);
    const s = await situacion();
    ok(s.ultimo === null && /Brevo/.test(s.ultimoError?.mensaje ?? ''), `el panel muestra el error (${s.ultimoError?.mensaje})`);
    const horas = (Date.parse(s.proximo) - Date.now()) / 3600000;
    ok(horas > 5.9 && horas <= 6, `y que reintenta en unas horas, no enseguida (${horas.toFixed(2)})`);
    ok(/No se pudo enviar el respaldo automático/.test(servidor.consola()), 'la consola lo avisa');
    const actividad = (await llamar('GET', '/admin/actividad?limite=50', { token: admin })).datos.registros;
    ok(actividad.some((r) => r.accion === 'respaldo.fallido'), 'queda anotado en la actividad');
    const r = await llamar('POST', '/admin/respaldo/enviar', { token: admin });
    ok(r.estado === 502 && /Brevo/.test(r.error), `a mano también explica el fallo (${r.estado})`);
  });
  api.comportamiento.estado = 201;
  const trasElFallo = api.recibidos.length;
  await conServidor(conFallo, AUTOMATICO, async ({ api: llamar, admin, situacion }) => {
    await pausa(2500);
    ok(api.recibidos.length === trasElFallo, 'tras reiniciar sigue esperando esas horas (no insiste en cada arranque)');
    const r = await llamar('POST', '/admin/respaldo/enviar', { token: admin });
    ok(r.estado === 200 && (await situacion()).ultimoError === null, 'un envío a mano que sale bien limpia el error');
  });
} finally {
  await api.parar();
  fs.rmSync(datos, { recursive: true, force: true });
  fs.rmSync(conFallo, { recursive: true, force: true });
}
terminar();
