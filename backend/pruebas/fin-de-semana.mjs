// Horario de fin de semana de octubre de 2026: sábado de 08:00 a 18:00 y domingo de 08:00 a 13:00. Un sistema nuevo arranca así; uno
// que ya funcionaba pasa al horario nuevo una sola vez, sin pisar lo que el administrador haya cambiado desde el panel.
import fs from 'node:fs';
import path from 'node:path';
import { arrancarServidor, carpetaTemporal, cliente, comprobador, pausa } from './servidor.mjs';

const { ok, terminar } = comprobador();

function proximo(diaDeLaSemana) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== diaDeLaSemana) d.setDate(d.getDate() + 1);
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
const SABADO = proximo(6);
const DOMINGO = proximo(0);
const horas = (desde, hasta) => Array.from({ length: hasta - desde }, (_, i) => `${String(desde + i).padStart(2, '0')}:00`);
const SABADO_NUEVO = JSON.stringify(horas(8, 18));
const DOMINGO_NUEVO = JSON.stringify(horas(8, 13));

const entreSemana = Object.fromEntries(
  ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => [
    dia,
    [
      ['08:00', '12:50'],
      ['13:10', '19:15'],
    ],
  ])
);
// Lo que guardaba una versión anterior del sistema.
const guardadoAntes = (finDeSemana) => ({ reservas: { ...entreSemana, ...finDeSemana }, cierres: [], contadorDeCierres: 0 });
const SABADO_ANTERIOR = [
  ['08:00', '12:50'],
  ['12:55', '17:50'],
];
const DOMINGO_ANTERIOR = [['08:00', '12:50']];

async function conServidor(datos, prueba) {
  const servidor = await arrancarServidor({ datos });
  try {
    await prueba(cliente(servidor.base));
  } finally {
    await servidor.parar();
  }
}
const franjas = async (api, fecha) => JSON.stringify((await api('GET', `/horarios/dia?fecha=${fecha}`)).datos?.franjas);

const carpetas = [];
const nueva = (nombre, horarios) => {
  const datos = carpetaTemporal(nombre);
  carpetas.push(datos);
  if (horarios) fs.writeFileSync(path.join(datos, 'horarios.json'), JSON.stringify(horarios));
  return datos;
};

try {
  console.log('Sistema nuevo');
  await conServidor(nueva('fin-de-semana-nuevo'), async ({ api }) => {
    const sabado = await franjas(api, SABADO);
    ok(sabado === SABADO_NUEVO, `el sábado se reserva de 08:00 a 18:00, sin pausa (${sabado})`);
    const domingo = await franjas(api, DOMINGO);
    ok(domingo === DOMINGO_NUEVO, `el domingo se reserva de 08:00 a 13:00 (${domingo})`);
  });

  console.log('Sistema que ya tenía el horario anterior');
  const anterior = nueva('fin-de-semana-anterior', guardadoAntes({ sabado: SABADO_ANTERIOR, domingo: DOMINGO_ANTERIOR }));
  await conServidor(anterior, async ({ api, entrar }) => {
    ok((await franjas(api, SABADO)) === SABADO_NUEVO, 'el sábado pasa al horario nuevo');
    ok((await franjas(api, DOMINGO)) === DOMINGO_NUEVO, 'el domingo pasa al horario nuevo');
    const lunes = JSON.parse((await franjas(api, proximo(1))) ?? '[]');
    ok(lunes.includes('08:00') && !lunes.includes('12:00') && lunes.includes('14:00'), 'de lunes a viernes no cambia nada');

    // Si después el administrador vuelve a poner el horario de antes, es su decisión: un reinicio no lo cambia otra vez.
    const token = await entrar('admin');
    const actuales = (await api('GET', '/admin/horarios', { token })).datos;
    const puesto = await api('PUT', '/admin/horarios', { token, cuerpo: { reservas: { ...actuales.reservas, sabado: SABADO_ANTERIOR } } });
    ok(puesto.estado === 200, `el administrador puede volver a poner el sábado anterior (${puesto.estado} ${puesto.error ?? ''})`);
    await pausa(600);
  });
  await conServidor(anterior, async ({ api }) => {
    ok((await franjas(api, SABADO)) === JSON.stringify(['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']), 'y al reiniciar se respeta lo que puso');
  });

  console.log('Sistema con el sábado cambiado por el administrador');
  const cambiado = nueva('fin-de-semana-cambiado', guardadoAntes({ sabado: [['09:00', '12:00']], domingo: DOMINGO_ANTERIOR }));
  await conServidor(cambiado, async ({ api }) => {
    ok((await franjas(api, SABADO)) === JSON.stringify(['09:00', '10:00', '11:00']), 'el sábado que cambió el administrador se queda como lo dejó');
    ok((await franjas(api, DOMINGO)) === DOMINGO_NUEVO, 'el domingo, que seguía como venía, pasa al horario nuevo');
  });
} finally {
  carpetas.forEach((datos) => fs.rmSync(datos, { recursive: true, force: true }));
}
terminar();
