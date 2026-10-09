// Corre las pruebas del servidor de la biblioteca.
//
//   npm test                    todas
//   npm test -- horas url-qr    solo esas
//   npm test -- --detalle       muestra todo lo que imprime cada prueba (sin esto, solo cuando falla)
//
// Las pruebas no tocan los datos de desarrollo: cada una arranca su propio servidor en un puerto libre, con una carpeta de datos
// temporal y claves de prueba. Nada sale a internet (el correo se prueba con servidores falsos en esta computadora).
//
// Para correrlas contra PostgreSQL en vez de archivos, define DATABASE_URL_PRUEBA con una base SOLO de pruebas (su nombre debe
// llevar «prueba» o «test»): antes de cada prueba se borra el esquema `biblioteca` de esa base.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(AQUI, '..');
const SITIO = path.join(BACKEND, '..', 'frontend', 'dist', 'index.html');
const require = createRequire(import.meta.url);

// `servidor`: la prueba usa un servidor que arranca este programa (su dirección llega en BASE). `fases`: se corre una vez por fase,
// reiniciando el servidor entre una y otra con los mismos datos. `sitio`: necesita el sitio compilado (frontend/dist).
// `modulos`: paquetes de desarrollo que necesita.
const PRUEBAS = [
  { nombre: 'propuesta', servidor: true, fases: ['escribir', 'verificar'] },
  { nombre: 'horas', servidor: true },
  { nombre: 'url-qr', servidor: true },
  { nombre: 'pdf', servidor: true },
  { nombre: 'proteccion', servidor: true, sitio: true },
  { nombre: 'kioscos', sitio: true },
  { nombre: 'salida' },
  { nombre: 'entregas' },
  { nombre: 'keepalive' },
  { nombre: 'correo', modulos: ['smtp-server', 'mailparser'] },
];

const CLAVES = { CLAVE_ADMIN: 'Admin-prueba-1', CLAVE_CIRCULACION: 'Circ-prueba-1', CLAVE_TESIS: 'Tesis-prueba-1', CLAVE_CONSULTA: 'Consulta-prueba-1' };
// Lo que haya en el entorno de quien corre las pruebas no debe colarse en los servidores de prueba.
const ENTORNO_LIMPIO = Object.fromEntries(
  ['DATABASE_URL', 'NODE_ENV', 'KIOSCOS_IP', 'TRUST_PROXY', 'CORS_ORIGIN', 'KEEPALIVE_URL', 'RENDER_EXTERNAL_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_SECURE', 'CORREO_API', 'CORREO_API_KEY', 'CORREO_REMITENTE', 'CORREO_API_URL'].map((n) => [n, ''])
);
const BASE_DE_PRUEBA = String(process.env.DATABASE_URL_PRUEBA || '').trim();

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

function puertoLibre() {
  return new Promise((resolver, rechazar) => {
    const s = net.createServer();
    s.once('error', rechazar);
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolver(port));
    });
  });
}

// Con PostgreSQL, cada prueba empieza con la base vacía.
async function vaciarBaseDePrueba() {
  if (!BASE_DE_PRUEBA) return;
  const nombre = new URL(BASE_DE_PRUEBA).pathname.slice(1).toLowerCase();
  if (!/prueba|test/.test(nombre)) {
    throw new Error(`DATABASE_URL_PRUEBA apunta a la base «${nombre}»: por seguridad su nombre debe llevar «prueba» o «test» (las pruebas borran sus datos)`);
  }
  const { Client } = require('pg');
  const cliente = new Client({ connectionString: BASE_DE_PRUEBA });
  await cliente.connect();
  try {
    await cliente.query('drop schema if exists biblioteca cascade');
  } finally {
    await cliente.end();
  }
}

async function arrancarServidor({ datos, sitio }) {
  const puerto = await puertoLibre();
  const salida = [];
  const hijo = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND,
    env: { ...process.env, ...ENTORNO_LIMPIO, ...CLAVES, PORT: String(puerto), DATA_DIR: datos, DATABASE_URL: BASE_DE_PRUEBA, LIMITE_ESCRITURAS: '1000', SERVE_FRONTEND: sitio ? '1' : '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  hijo.stdout.on('data', (d) => salida.push(String(d)));
  hijo.stderr.on('data', (d) => salida.push(String(d)));
  const terminado = new Promise((resolver) => hijo.once('exit', resolver));
  const base = `http://localhost:${puerto}`;
  const parar = async () => {
    hijo.kill();
    await terminado;
  };
  for (let i = 0; i < 100; i += 1) {
    if (hijo.exitCode !== null) break;
    try {
      // «iniciando» es la respuesta mientras espera a la base de datos: todavía no atiende.
      const r = await fetch(`${base}/health`);
      if (r.ok && (await r.json()).data === 'ok') return { base, parar, salida };
    } catch {
      // todavía no abre el puerto
    }
    await pausa(150);
  }
  await parar();
  throw new Error(`El servidor de prueba no arrancó:\n${salida.join('')}`);
}

function correrArchivo(archivo, env) {
  return new Promise((resolver) => {
    const salida = [];
    const hijo = spawn(process.execPath, [archivo], { cwd: AQUI, env: { ...process.env, ...ENTORNO_LIMPIO, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    hijo.stdout.on('data', (d) => salida.push(String(d)));
    hijo.stderr.on('data', (d) => salida.push(String(d)));
    hijo.once('exit', (codigo) => resolver({ codigo, salida: salida.join('') }));
  });
}

function faltantes(prueba) {
  const motivos = [];
  if (prueba.sitio && !fs.existsSync(SITIO)) motivos.push('falta el sitio compilado (corre «npm run build» dentro de frontend)');
  (prueba.modulos ?? []).forEach((modulo) => {
    try {
      require.resolve(modulo);
    } catch {
      motivos.push(`falta el paquete ${modulo} (corre «npm install» dentro de backend)`);
    }
  });
  return motivos;
}

// La última línea con contenido es el resumen que imprime cada prueba.
const resumen = (salida) => salida.trim().split('\n').filter((l) => l.trim()).pop()?.trim() ?? '';

async function correr(prueba, detalle) {
  const archivo = path.join(AQUI, `${prueba.nombre}.mjs`);
  const datos = fs.mkdtempSync(path.join(os.tmpdir(), `biblioteca-prueba-${prueba.nombre}-`));
  const partes = [];
  let bien = true;
  try {
    if (prueba.servidor) await vaciarBaseDePrueba();
    for (const fase of prueba.fases ?? [null]) {
      const servidor = prueba.servidor ? await arrancarServidor({ datos, sitio: prueba.sitio }) : null;
      try {
        const r = await correrArchivo(archivo, { ...(servidor ? { BASE: servidor.base } : {}), ...(fase ? { FASE: fase } : {}) });
        partes.push(r.salida);
        if (r.codigo !== 0) {
          bien = false;
          if (servidor) partes.push(`--- consola del servidor ---\n${servidor.salida.join('')}`);
          break;
        }
      } finally {
        if (servidor) await servidor.parar();
      }
    }
  } catch (error) {
    bien = false;
    partes.push(String(error.stack || error));
  } finally {
    fs.rmSync(datos, { recursive: true, force: true });
  }
  const salida = partes.join('\n');
  console.log(`${bien ? ' bien ' : 'FALLA '} ${prueba.nombre.padEnd(12)} ${bien ? resumen(salida) : ''}`);
  if (!bien || detalle) console.log(`${salida.trimEnd()}\n`);
  return bien;
}

const argumentos = process.argv.slice(2);
const detalle = argumentos.includes('--detalle');
const pedidas = argumentos.filter((a) => !a.startsWith('--'));
const desconocidas = pedidas.filter((n) => !PRUEBAS.some((p) => p.nombre === n));
if (desconocidas.length > 0) {
  console.error(`No conozco estas pruebas: ${desconocidas.join(', ')}. Las que hay: ${PRUEBAS.map((p) => p.nombre).join(', ')}`);
  process.exit(2);
}

console.log(`Pruebas del servidor (${BASE_DE_PRUEBA ? 'con PostgreSQL' : 'con archivos'})\n`);
let fallas = 0;
let omitidas = 0;
for (const prueba of PRUEBAS.filter((p) => pedidas.length === 0 || pedidas.includes(p.nombre))) {
  const motivos = faltantes(prueba);
  if (motivos.length > 0) {
    omitidas += 1;
    console.log(`omitida ${prueba.nombre.padEnd(12)} ${motivos.join('; ')}`);
  } else if (!(await correr(prueba, detalle))) {
    fallas += 1;
  }
}
console.log(`\n${fallas === 0 ? 'Todo bien' : `${fallas} con fallas`}${omitidas > 0 ? ` · ${omitidas} omitidas` : ''}`);
process.exit(fallas === 0 ? 0 : 1);
