// Claves de las cuentas iniciales: las variables CLAVE_* crean la cuenta la primera vez y después ya no pisan la clave que la persona
// puso desde el panel. RESTABLECER_CLAVES=1 es la salida de emergencia para una clave olvidada.
import fs from 'node:fs';
import { arrancarServidor, carpetaTemporal, cliente, comprobador, pausa, CLAVE_DE } from './servidor.mjs';

const { ok, terminar } = comprobador();
const datos = carpetaTemporal('claves');
const NUEVA = 'Clave-del-panel-22';
const DE_EMERGENCIA = 'Clave-de-emergencia-33';

async function conServidor(env, prueba) {
  const servidor = await arrancarServidor({ datos, env });
  try {
    await prueba(cliente(servidor.base), servidor);
    await pausa(700); // que alcance a guardar antes de apagarlo
  } finally {
    await servidor.parar();
  }
}

try {
  console.log('Primer arranque: las cuentas se crean con las claves del entorno');
  await conServidor({}, async ({ api, entrar }) => {
    const admin = await entrar('admin');
    ok(Boolean(admin), 'admin entra con CLAVE_ADMIN');
    const cambio = await api('POST', '/auth/cambiar-clave', { token: admin, cuerpo: { claveActual: CLAVE_DE.admin, claveNueva: NUEVA } });
    ok(cambio.estado === 200, `admin cambia su clave desde el panel (${cambio.estado})`);
    ok(Boolean(await entrar('admin', NUEVA)), 'la clave nueva sirve enseguida');
  });

  console.log('Reinicio con las mismas variables: la clave del panel se conserva');
  await conServidor({}, async ({ entrar }) => {
    ok(Boolean(await entrar('admin', NUEVA)), 'admin sigue entrando con la clave que puso en el panel');
    ok((await entrar('admin', CLAVE_DE.admin)) === null, 'la clave de CLAVE_ADMIN ya no entra');
    ok(Boolean(await entrar('tesis')), 'las cuentas que nadie cambió siguen con su clave');
  });

  console.log('Cambiar la variable de una cuenta que ya existe no cambia su clave');
  await conServidor({ CLAVE_TESIS: 'Otra-clave-de-tesis-44' }, async ({ entrar }) => {
    ok(Boolean(await entrar('tesis')), 'tesis entra con la clave con la que se creó');
    ok((await entrar('tesis', 'Otra-clave-de-tesis-44')) === null, 'la clave nueva de la variable no entra');
  });

  console.log('Clave olvidada: RESTABLECER_CLAVES=1 vuelve a poner las de las variables');
  await conServidor({ CLAVE_ADMIN: DE_EMERGENCIA, RESTABLECER_CLAVES: '1' }, async ({ entrar }, servidor) => {
    ok(Boolean(await entrar('admin', DE_EMERGENCIA)), 'admin entra con la clave de la variable');
    ok((await entrar('admin', NUEVA)) === null, 'la clave anterior ya no entra');
    ok(Boolean(await entrar('circulacion')), 'las cuentas cuya variable no cambió siguen igual');
    ok(/RESTABLECER_CLAVES/.test(servidor.consola()) && /admin/.test(servidor.consola()), 'la consola avisa qué cuentas se restablecieron y que hay que quitar la variable');
    ok(!servidor.consola().includes(DE_EMERGENCIA), 'la consola no muestra la clave');
  });

  console.log('Sin RESTABLECER_CLAVES la clave restablecida se queda');
  await conServidor({ CLAVE_ADMIN: 'Ya-no-importa-55' }, async ({ entrar }) => {
    ok(Boolean(await entrar('admin', DE_EMERGENCIA)), 'admin sigue con la clave restablecida');
  });

  console.log('Una cuenta inicial sin variable recibe una clave temporal que no se guarda');
  const otros = carpetaTemporal('claves-temporal');
  try {
    const servidor = await arrancarServidor({ datos: otros, env: { CLAVE_CONSULTA: '' } });
    try {
      const { entrar } = cliente(servidor.base);
      ok((await entrar('consulta')) === null, 'consulta no entra con una clave que no se definió');
      const temporal = /consulta\s+(\S+)\s+\(para fijarla: CLAVE_CONSULTA/.exec(servidor.consola())?.[1];
      ok(Boolean(temporal) && Boolean(await entrar('consulta', temporal)), 'entra con la clave temporal que muestra la consola');
      await pausa(700);
      const guardadas = JSON.parse(fs.readFileSync(`${otros}/cuentas.json`, 'utf8')).cuentas.map((c) => c.usuario);
      ok(!guardadas.includes('consulta') && guardadas.includes('admin'), 'la cuenta temporal no se guarda; las demás sí');
    } finally {
      await servidor.parar();
    }
    // Cuando por fin se define la variable, esa cuenta se crea con ella (es su «primera vez»).
    const despues = await arrancarServidor({ datos: otros });
    try {
      ok(Boolean(await cliente(despues.base).entrar('consulta')), 'al definir la variable, la cuenta se crea con esa clave');
    } finally {
      await despues.parar();
    }
  } finally {
    fs.rmSync(otros, { recursive: true, force: true });
  }
} finally {
  fs.rmSync(datos, { recursive: true, force: true });
}
terminar();
