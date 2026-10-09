// Revisión automática de los enlaces de las tesis: el servidor comprueba solo que cada URL siga respondiendo, marca las rotas y no
// da falsas alarmas (reintenta lo pasajero y no llama «roto» a un sitio que solo rechaza las revisiones automáticas).
// Las URL apuntan a un «repositorio» falso en esta computadora.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { arrancarServidor, carpetaTemporal, cliente, comprobador, pausa, puertoLibre } from './servidor.mjs';

const { ok, terminar } = comprobador();

// Un repositorio de documentos falso: cada ruta responde distinto y cuenta cuántas veces la piden.
async function repositorioFalso() {
  const pedidos = {};
  const estado = { noExiste: 404 };
  const servidor = http.createServer((req, res) => {
    const ruta = req.url.split('?')[0];
    pedidos[ruta] = (pedidos[ruta] ?? 0) + 1;
    const responder = (codigo) => {
      res.writeHead(codigo, { 'Content-Type': 'text/plain' });
      res.end(req.method === 'HEAD' ? undefined : 'documento');
    };
    if (ruta === '/bien' || ruta === '/otro') return responder(200);
    if (ruta === '/no-existe') return responder(estado.noExiste);
    if (ruta === '/prohibido') return responder(403);
    if (ruta === '/solo-get') return responder(req.method === 'HEAD' ? 405 : 200);
    if (ruta === '/intermitente') return responder(pedidos[ruta] === 1 ? 503 : 200); // falla solo la primera vez
    return responder(404);
  });
  const puerto = await puertoLibre();
  await new Promise((r) => servidor.listen(puerto, '127.0.0.1', r));
  return { pedidos, estado, base: `http://127.0.0.1:${puerto}`, parar: () => new Promise((r) => servidor.close(r)) };
}

const repo = await repositorioFalso();
const puertoCerrado = await puertoLibre(); // ahí no escucha nadie: un servidor caído
const datos = carpetaTemporal('enlaces');
const RAPIDO = { VERIFICAR_ENLACES_PAUSA_MS: '0', VERIFICAR_ENLACES_REINTENTO_MS: '50' };
const TESIS = {
  'E-OK': `${repo.base}/bien`,
  'E-404': `${repo.base}/no-existe`,
  'E-403': `${repo.base}/prohibido`,
  'E-GET': `${repo.base}/solo-get`,
  'E-INT': `${repo.base}/intermitente`,
  'E-CAIDO': `http://127.0.0.1:${puertoCerrado}/documento.pdf`,
  'E-SIN': undefined,
};

async function conServidor(env, prueba) {
  const servidor = await arrancarServidor({ datos, env: { ...RAPIDO, ...env } });
  try {
    const c = cliente(servidor.base);
    const tesis = await c.entrar('tesis');
    const situacion = async () => (await c.api('GET', '/admin/qr/revision', { token: tesis })).datos;
    const resultados = async () => Object.fromEntries((await c.api('GET', '/admin/qr?porPagina=100', { token: tesis })).datos.items.map((t) => [t.id, t.qr.resultado]));
    // Pide una revisión y espera a que termine.
    const revisar = async () => {
      const r = await c.api('POST', '/admin/qr/revision', { token: tesis });
      for (let i = 0; i < 200 && (await situacion()).enCurso; i += 1) await pausa(50);
      return r;
    };
    return await prueba({ ...c, tesis, situacion, resultados, revisar, servidor });
  } finally {
    await pausa(700);
    await servidor.parar();
  }
}

try {
  console.log('Revisar ahora: cada enlace queda con su resultado');
  await conServidor({ VERIFICAR_ENLACES_PRIMERA_S: '3600' }, async ({ api, entrar, tesis, situacion, resultados, revisar }) => {
    for (const [id, urlTesis] of Object.entries(TESIS)) {
      const r = await api('POST', '/admin/catalogo', { token: tesis, cuerpo: { id, titulo: `Tesis de prueba de enlaces ${id}`, autor: 'Autora, Una', anio: '2024', urlTesis } });
      if (r.estado !== 201) ok(false, `no se pudo crear ${id} (${r.estado} ${r.error})`);
    }
    let s = await situacion();
    ok(s.activa === true && s.dias === 7 && s.enCurso === false && s.ultimaPasada === null, `el panel dice que la revisión es semanal y que aún no pasó (${JSON.stringify(s)})`);
    ok(s.pendientes === 14, `hay 14 tesis por revisar: las 7 de ejemplo y las 7 nuevas (${s.pendientes})`);

    const inicio = await revisar();
    ok(inicio.estado === 202 && inicio.datos.iniciada === true, `la revisión arranca (${inicio.estado})`);
    const r = await resultados();
    ok(r['E-OK'] === 'ok', `un enlace que responde: correcto (${r['E-OK']})`);
    ok(r['E-404'] === 'enlace_roto', `un enlace que ya no existe: roto (${r['E-404']})`);
    ok(r['E-CAIDO'] === 'enlace_roto', `un servidor que no contesta: roto (${r['E-CAIDO']})`);
    ok(r['E-403'] === 'sin_comprobar', `un sitio que rechaza las revisiones automáticas no se llama roto (${r['E-403']})`);
    ok(r['E-GET'] === 'ok', `un sitio que no admite HEAD se comprueba con GET (${r['E-GET']})`);
    ok(r['E-INT'] === 'ok' && repo.pedidos['/intermitente'] === 2, `un fallo pasajero se reintenta antes de dar la alarma (${r['E-INT']}, ${repo.pedidos['/intermitente']} pedidos)`);
    ok(r['E-SIN'] === 'solo_ficha' && r['T-2022-00071'] === 'solo_ficha', `sin documento que ofrecer: lleva a la ficha, sin pedir nada (${r['E-SIN']})`);
    ok(r['T-2024-00123'] === 'ok', `con el documento de ejemplo del sistema: correcto (${r['T-2024-00123']})`);

    s = await situacion();
    ok(s.pendientes === 0 && s.rotos === 2 && s.sinComprobar === 1, `el panel cuenta 2 rotos y 1 sin comprobar, nada pendiente (${JSON.stringify({ p: s.pendientes, r: s.rotos, s: s.sinComprobar })})`);
    ok(s.ultimaPasada?.revisadas === 14 && s.ultimaPasada.rotas === 2 && s.ultimaPasada.automatica === false, `y resume la última pasada (${JSON.stringify(s.ultimaPasada)})`);
    const resumen = (await api('GET', '/admin/resumen', { token: tesis })).datos.tesis;
    ok(resumen.qrPorRevisar === 2 && resumen.qrPorRevisarMuestra.every((t) => t.resultado === 'enlace_roto'), `el resumen del panel avisa solo de los rotos (${resumen.qrPorRevisar})`);

    const admin = await entrar('admin');
    const actividad = (await api('GET', '/admin/actividad?limite=50', { token: admin })).datos.registros.find((x) => x.accion === 'qr.revision');
    ok(actividad && actividad.usuario === 'tesis' && /E-404/.test(actividad.detalle) && /E-CAIDO/.test(actividad.detalle), `la actividad anota cuáles salieron rotos (${actividad?.detalle})`);

    console.log('Filtros de la lista');
    const lista = async (verificacion) => (await api('GET', `/admin/qr?porPagina=100&verificacion=${verificacion}`, { token: tesis })).datos.items.map((t) => t.id).sort().join();
    ok((await lista('rotos')) === 'E-404,E-CAIDO', `solo los rotos (${await lista('rotos')})`);
    ok((await lista('sin_comprobar')) === 'E-403', `solo los que no se pudieron comprobar (${await lista('sin_comprobar')})`);
    ok((await lista('sin_verificar')) === '', 'ninguno pendiente');

    console.log('No se vuelve a pedir lo que ya se revisó');
    const antes = { ...repo.pedidos };
    await revisar();
    ok(repo.pedidos['/bien'] === antes['/bien'] && repo.pedidos['/no-existe'] === antes['/no-existe'], 'otra revisión enseguida no pide nada al repositorio');
    ok((await situacion()).ultimaPasada.revisadas === 0, 'y dice que no había nada que revisar');

    console.log('Una URL nueva o cambiada se revisa en la siguiente pasada');
    await api('PATCH', '/admin/catalogo/E-OK', { token: tesis, cuerpo: { urlTesis: `${repo.base}/otro` } });
    ok((await situacion()).pendientes === 1 && (await lista('sin_verificar')) === 'E-OK', 'cambiar la URL deja esa tesis pendiente');
    await revisar();
    ok(repo.pedidos['/otro'] === 1 && (await resultados())['E-OK'] === 'ok' && (await situacion()).ultimaPasada.revisadas === 1, 'y la revisión comprueba solo esa');

    console.log('Permisos');
    const circulacion = await entrar('circulacion');
    ok((await api('GET', '/admin/qr/revision', { token: circulacion })).estado === 403 && (await api('POST', '/admin/qr/revision', { token: circulacion })).estado === 403, 'circulación no ve ni lanza la revisión');
    ok((await api('GET', '/admin/qr/revision')).estado === 401, 'sin sesión tampoco');
  });

  console.log('La revisión automática: sola, al poco de arrancar');
  // Con el servidor apagado se envejecen las fechas: un roto de hace 2 días toca (los rotos se revisan cada día), un correcto de hace
  // 2 días no (los correctos, cada semana) y un correcto de hace 8 días sí. Mientras tanto, el enlace roto volvió a funcionar.
  const archivo = path.join(datos, 'catalogo.json');
  const catalogo = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const hace = (dias) => new Date(Date.now() - dias * 86400000).toISOString();
  const tesisDe = (id) => catalogo.tesis.find((t) => t.id === id);
  tesisDe('E-404').qr.verificadoEn = hace(2);
  tesisDe('E-GET').qr.verificadoEn = hace(2);
  tesisDe('E-INT').qr.verificadoEn = hace(8);
  fs.writeFileSync(archivo, JSON.stringify(catalogo));
  repo.estado.noExiste = 200;
  const antes = { ...repo.pedidos };
  await conServidor({ VERIFICAR_ENLACES_PRIMERA_S: '1' }, async ({ api, entrar, situacion, resultados, servidor }) => {
    let s = await situacion();
    for (let i = 0; i < 100 && !s.ultimaPasada; i += 1) {
      await pausa(100);
      s = await situacion();
    }
    ok(s.ultimaPasada?.automatica === true, 'la pasada corre sola, sin que nadie la pida');
    ok(s.ultimaPasada?.revisadas === 2 && s.ultimaPasada.recuperadas === 1, `revisa lo que tocaba: el roto de hace 2 días y el correcto de hace 8 (${JSON.stringify(s.ultimaPasada)})`);
    ok(repo.pedidos['/no-existe'] === antes['/no-existe'] + 1 && repo.pedidos['/intermitente'] === antes['/intermitente'] + 1, 'pide solo esos dos enlaces');
    ok(repo.pedidos['/solo-get'] === antes['/solo-get'] && repo.pedidos['/otro'] === antes['/otro'], 'y deja en paz los correctos revisados hace poco');
    const r = await resultados();
    ok(r['E-404'] === 'ok' && s.rotos === 1, `el enlace que volvió a funcionar deja de estar roto (${r['E-404']}, quedan ${s.rotos})`);
    const actividad = (await api('GET', '/admin/actividad?limite=50', { token: await entrar('admin') })).datos.registros.find((x) => x.accion === 'qr.revision' && x.usuario === 'sistema');
    ok(actividad && /E-404/.test(actividad.detalle) && /funcionar/.test(actividad.detalle), `la actividad lo anota como hecho por el sistema (${actividad?.detalle})`);
    ok(/Revisión automática de enlaces: cada 7 días/.test(servidor.consola()), 'la consola dice al arrancar que está activa');
  });

  console.log('Se puede apagar');
  await conServidor({ VERIFICAR_ENLACES_DIAS: '0', VERIFICAR_ENLACES_PRIMERA_S: '1' }, async ({ situacion, servidor }) => {
    await pausa(1800);
    const s = await situacion();
    ok(s.activa === false && s.ultimaPasada === null, 'con VERIFICAR_ENLACES_DIAS=0 no corre sola');
    ok(/Revisión automática de enlaces: apagada/.test(servidor.consola()), 'y la consola lo dice');
  });
} finally {
  await repo.parar();
  fs.rmSync(datos, { recursive: true, force: true });
}
terminar();
