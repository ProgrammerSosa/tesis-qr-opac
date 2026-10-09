// Cabeceras de protección del navegador: la política de contenido (CSP) que impide ejecutar código ajeno al sitio y HSTS, que obliga a
// usar HTTPS. Comprueba qué se manda, a qué respuestas y que se pueden apagar.
import fs from 'node:fs';
import { arrancarServidor, carpetaTemporal, comprobador } from './servidor.mjs';

const { ok, terminar } = comprobador();
const datos = carpetaTemporal('cabeceras');
const pedir = (base, ruta, cabeceras = {}) => fetch(`${base}${ruta}`, { redirect: 'manual', headers: cabeceras });
const PORHTTPS = { 'X-Forwarded-Proto': 'https' }; // lo que agrega el proxy de la plataforma cuando la visita llegó por HTTPS

try {
  console.log('Política de contenido (CSP)');
  const servidor = await arrancarServidor({ datos, sitio: true, env: { TRUST_PROXY: '1' } });
  try {
    for (const ruta of ['/', '/catalogo', '/tesis/T-2024-00123', '/privateAccess/acceso']) {
      const r = await pedir(servidor.base, ruta);
      ok(r.status === 200 && Boolean(r.headers.get('content-security-policy')), `${ruta} lleva la política (${r.status})`);
    }
    const politica = (await pedir(servidor.base, '/')).headers.get('content-security-policy') ?? '';
    const directiva = (nombre) => politica.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${nombre} `)) ?? '';
    ok(directiva('default-src') === "default-src 'self'", `por defecto, solo lo del propio sitio (${directiva('default-src')})`);
    ok(directiva('script-src') === "script-src 'self'", `los scripts, solo los del sitio: ni en línea ni de fuera (${directiva('script-src')})`);
    ok(directiva('object-src') === "object-src 'none'", 'sin complementos');
    ok(directiva('base-uri') === "base-uri 'self'" && directiva('form-action') === "form-action 'self'", 'ni cambiar la base de los enlaces ni enviar formularios afuera');
    ok(directiva('frame-ancestors') === "frame-ancestors 'self'", 'ningún otro sitio puede mostrar este dentro de un marco');
    ok(/fonts\.googleapis\.com/.test(directiva('style-src')) && /fonts\.gstatic\.com/.test(directiva('font-src')), 'se permiten las tipografías que usa el sitio');
    ok(/'self'/.test(directiva('frame-src')) && /https:/.test(directiva('frame-src')), 'el visor puede mostrar el documento de la tesis, esté donde esté');
    ok(directiva('connect-src') === "connect-src 'self'", 'el sitio solo habla con su propio servidor');

    // Lo que el sitio compilado carga de verdad tiene que caber en la política.
    const html = await (await pedir(servidor.base, '/')).text();
    ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(html), 'la página no trae scripts en línea (los bloquearía la política)');
    const externos = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"/]+)/g)].map((m) => m[1]);
    ok(externos.every((origen) => politica.includes(origen)), `todo origen externo de la página está permitido (${[...new Set(externos)].join(', ') || 'ninguno'})`);

    for (const ruta of ['/api/tesis', '/api/tesis/T-2024-00123/documento', '/health']) {
      const r = await pedir(servidor.base, ruta);
      ok(r.status === 200 && r.headers.get('content-security-policy') === null, `${ruta} no la lleva: no es una página (y el visor de PDF del navegador no la tolera)`);
    }
    const yaEstaban = await pedir(servidor.base, '/');
    ok(yaEstaban.headers.get('x-content-type-options') === 'nosniff' && yaEstaban.headers.get('x-frame-options') === 'SAMEORIGIN', 'las cabeceras que ya había siguen');

    console.log('HSTS');
    ok((await pedir(servidor.base, '/')).headers.get('strict-transport-security') === null, 'por HTTP no se manda (dejaría sin acceso a una instalación sin HTTPS)');
    const seguro = (await pedir(servidor.base, '/', PORHTTPS)).headers.get('strict-transport-security');
    ok(/^max-age=\d{7,}$/.test(seguro ?? ''), `por HTTPS sí, por varios meses (${seguro})`);
    ok(Boolean((await pedir(servidor.base, '/api/tesis', PORHTTPS)).headers.get('strict-transport-security')), 'también en la API');
  } finally {
    await servidor.parar();
  }

  console.log('Sin el aviso del proxy no se confía en la cabecera');
  const sinProxy = await arrancarServidor({ datos, sitio: true });
  try {
    ok((await pedir(sinProxy.base, '/', PORHTTPS)).headers.get('strict-transport-security') === null, 'sin TRUST_PROXY, X-Forwarded-Proto no cuenta');
  } finally {
    await sinProxy.parar();
  }

  console.log('Se pueden apagar');
  const apagado = await arrancarServidor({ datos, sitio: true, env: { TRUST_PROXY: '1', CSP: '0', HSTS: '0' } });
  try {
    const r = await pedir(apagado.base, '/', PORHTTPS);
    ok(r.status === 200 && r.headers.get('content-security-policy') === null, 'CSP=0 quita la política');
    ok(r.headers.get('strict-transport-security') === null, 'HSTS=0 quita HSTS');
    ok(r.headers.get('x-content-type-options') === 'nosniff', 'y lo demás queda');
  } finally {
    await apagado.parar();
  }
} finally {
  fs.rmSync(datos, { recursive: true, force: true });
}
terminar();
