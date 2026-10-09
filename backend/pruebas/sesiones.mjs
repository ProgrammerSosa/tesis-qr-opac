// Las sesiones del panel se guardan: reiniciar el servidor (o publicar una versión) no saca al personal. Lo que sí las cierra sigue
// cerrándolas después del reinicio: salir, vencer, cambiar la clave, desactivar la cuenta o restablecer claves.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { arrancarServidor, carpetaTemporal, cliente, comprobador, pausa } from './servidor.mjs';

const { ok, terminar } = comprobador();
const datos = carpetaTemporal('sesiones');
const archivo = path.join(datos, 'sesiones.json');
const huella = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Corre `prueba` con un servidor encendido sobre los mismos datos y espera a que guarde antes de apagarlo.
async function conServidor(env, prueba) {
  const servidor = await arrancarServidor({ datos, env });
  try {
    return await prueba({ ...cliente(servidor.base), base: servidor.base });
  } finally {
    await pausa(700);
    await servidor.parar();
  }
}
const entra = async (api, token) => (await api('GET', '/auth/me', { token })).estado === 200;

try {
  console.log('Se guardan sin la ficha de acceso');
  const fichas = await conServidor({}, async ({ api, entrar }) => {
    const admin = await entrar('admin');
    const tesis = await entrar('tesis');
    const circulacion = await entrar('circulacion');
    const consulta = await entrar('consulta');
    const quienSale = await entrar('consulta');
    await api('POST', '/admin/personal', { token: admin, cuerpo: { usuario: 'temporal', nombre: 'Cuenta de paso', rol: 'consulta', clave: 'Clave-de-paso-99' } });
    const temporal = await entrar('temporal', 'Clave-de-paso-99');
    ok([admin, tesis, circulacion, consulta, quienSale, temporal].every(Boolean), 'entran seis sesiones');
    ok((await api('POST', '/auth/logout', { token: quienSale })).estado === 200, 'una cierra su sesión');
    return { admin, tesis, circulacion, consulta, quienSale, temporal };
  });
  const guardado = fs.readFileSync(archivo, 'utf8');
  ok(JSON.parse(guardado).sesiones.length === 5, `quedan guardadas las cinco abiertas (${JSON.parse(guardado).sesiones.length})`);
  ok(Object.values(fichas).every((token) => !guardado.includes(token)), 'el archivo no contiene ninguna ficha de acceso');
  ok(guardado.includes(huella(fichas.admin)) && !guardado.includes(huella(fichas.quienSale)), 'solo guarda su huella, y no la de quien salió');

  console.log('Después de reiniciar siguen abiertas');
  await conServidor({}, async ({ api, base }) => {
    ok(await entra(api, fichas.admin), 'la del administrador sigue');
    const yo =await api('GET', '/auth/me', { token: fichas.tesis });
    ok(yo.estado === 200 && yo.datos.usuario === 'tesis' && yo.datos.rol === 'tesis', 'la de tesis sigue, con su usuario y su rol');
    ok((await api('GET', '/admin/personal', { token: fichas.tesis })).estado === 403, 'y su rol sigue limitando lo que puede ver');
    ok(!(await entra(api, fichas.quienSale)), 'la que se cerró no revive');
    ok(!(await entra(api, 'x'.repeat(64))), 'una ficha inventada no entra');
    const situacion = await api('GET', '/admin/almacenamiento', { token: fichas.admin });
    ok(situacion.datos.documentos.some((d) => d.nombre === 'sesiones'), 'el panel muestra que las sesiones están guardadas');
    const respaldo = await (await fetch(`${base}/api/admin/respaldo`, { headers: { Authorization: `Bearer ${fichas.admin}` } })).json();
    ok(respaldo.documentos.cuentas && respaldo.documentos.sesiones === undefined, 'el respaldo no lleva las sesiones abiertas');

    // Lo que cierra sesiones, antes del siguiente reinicio.
    await api('POST', '/admin/personal/circulacion/clave', { token: fichas.admin, cuerpo: { clave: 'Otra-clave-larga-77' } });
    await api('PATCH', '/admin/personal/temporal', { token: fichas.admin, cuerpo: { activa: false } });
    await api('PATCH', '/admin/personal/consulta', { token: fichas.admin, cuerpo: { nombre: 'Consulta (renombrada)' } });
    ok(!(await entra(api, fichas.circulacion)), 'restablecer la clave de una cuenta cierra su sesión');
    ok(!(await entra(api, fichas.temporal)), 'desactivar una cuenta cierra su sesión');
  });

  console.log('Lo que las cerró sigue cerrado tras otro reinicio');
  // Entre un arranque y otro: una sesión que ya venció y otra de una cuenta que ya no existe.
  const contenido = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const vencida = crypto.randomBytes(32).toString('hex');
  const huerfana = crypto.randomBytes(32).toString('hex');
  contenido.sesiones.push({ huella: huella(vencida), usuario: 'admin', nombre: 'Administración', rol: 'administrador', expiraEn: Date.now() - 1000 });
  contenido.sesiones.push({ huella: huella(huerfana), usuario: 'fantasma', nombre: 'No existe', rol: 'administrador', expiraEn: Date.now() + 3600000 });
  fs.writeFileSync(archivo, JSON.stringify(contenido));
  await conServidor({}, async ({ api }) => {
    ok(await entra(api, fichas.admin), 'la del administrador sigue');
    ok(!(await entra(api, fichas.circulacion)) && !(await entra(api, fichas.temporal)), 'las cerradas no reviven');
    ok(!(await entra(api, vencida)), 'una sesión vencida no entra');
    ok(!(await entra(api, huerfana)), 'una sesión de una cuenta que no existe no entra');
    ok((await api('GET', '/auth/me', { token: fichas.consulta })).datos?.nombre === 'Consulta (renombrada)', 'el cambio de nombre se conserva en la sesión');
  });
  const limpio = JSON.parse(fs.readFileSync(archivo, 'utf8')).sesiones.map((s) => s.huella);
  ok(!limpio.includes(huella(vencida)) && !limpio.includes(huella(huerfana)), 'las vencidas y las huérfanas se borran de lo guardado');

  console.log('Restablecer claves cierra las sesiones de esas cuentas');
  await conServidor({ CLAVE_ADMIN: 'Clave-restablecida-88', RESTABLECER_CLAVES: '1' }, async ({ api, entrar }) => {
    ok(!(await entra(api, fichas.admin)), 'la sesión del administrador se cerró');
    ok(await entra(api, fichas.tesis), 'las de las cuentas que no cambiaron siguen');
    ok(Boolean(await entrar('admin', 'Clave-restablecida-88')), 'y entra con la clave restablecida');
  });
} finally {
  fs.rmSync(datos, { recursive: true, force: true });
}
terminar();
