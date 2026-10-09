// Candado de red de los kioscos (KIOSCOS_IP): arranca su propio servidor en el puerto 4003 con esta computadora como «kiosco» y comprueba
// que el panel y su API se le niegan aunque cambien las mayúsculas, y que el resto del sitio sigue abierto.
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = fileURLToPath(new URL('..', import.meta.url));
const BASE = 'http://localhost:4003';
let fallos = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fallos += 1;
    console.log('  FALLA:', msg);
  } else console.log('  ok:', msg);
};

const hijo = spawn(process.execPath, ['server.js'], {
  cwd: backend,
  env: {
    ...process.env,
    PORT: '4003',
    DATA_DIR: path.join(os.tmpdir(), `kioscos-${Date.now()}`),
    SERVE_FRONTEND: '1',
    KIOSCOS_IP: '127.0.0.1,::1,::ffff:127.0.0.1',
    CLAVE_ADMIN: 'Admin-prueba-1',
    CLAVE_CIRCULACION: 'Circ-prueba-1',
    CLAVE_TESIS: 'Tesis-prueba-1',
    CLAVE_CONSULTA: 'Consulta-prueba-1',
  },
  stdio: 'ignore',
});

async function esperarServidor() {
  for (let i = 0; i < 40; i += 1) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return true;
    } catch {
      /* todavía no arranca */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

try {
  ok(await esperarServidor(), 'el servidor de prueba con KIOSCOS_IP arrancó');
  const pedir = (ruta, opciones = {}) => fetch(`${BASE}${ruta}`, { redirect: 'manual', ...opciones });

  console.log('El panel se le niega al kiosco (redirige al inicio)');
  for (const ruta of ['/privateAccess', '/privateAccess/', '/privateAccess/resumen', '/PrivateAccess/resumen', '/PRIVATEACCESS', '/privateaccess/acceso']) {
    const r = await pedir(ruta);
    ok(r.status === 302 && r.headers.get('location') === '/', `${ruta} → ${r.status} ${r.headers.get('location')}`);
  }

  console.log('Su API y el inicio de sesión del personal también (403)');
  for (const ruta of ['/api/admin/resumen', '/Api/Admin/resumen', '/API/ADMIN/personal', '/api/auth/me', '/Api/Auth/Login']) {
    const r = await pedir(ruta, { method: ruta.toLowerCase().includes('login') ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: ruta.toLowerCase().includes('login') ? '{}' : undefined });
    ok(r.status === 403, `${ruta} → ${r.status}`);
  }
  const inicioDeSesion = await pedir('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: 'admin', clave: 'Admin-prueba-1' }) });
  ok(inicioDeSesion.status === 403, `no puede iniciar sesión como personal desde un kiosco (${inicioDeSesion.status})`);

  console.log('El resto del sitio funciona igual');
  for (const ruta of ['/', '/catalogo', '/sala-de-estudio', '/admin/resumen', '/api/tesis', '/api/horarios/semana', '/api/reservas/condiciones']) {
    const r = await pedir(ruta);
    ok(r.status === 200, `${ruta} → ${r.status}`);
  }
} finally {
  hijo.kill();
}

console.log(fallos === 0 ? '\nTODO BIEN' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
