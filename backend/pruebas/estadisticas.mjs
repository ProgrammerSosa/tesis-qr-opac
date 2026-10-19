// Estadísticas por período: un día, una semana, un mes o un rango de fechas que elige el administrador. Las reservas cuentan por el
// día en que se usa el lugar; las solicitudes y los eventos, por el día en que ocurrieron (hora de la biblioteca).
import fs from 'node:fs';
import path from 'node:path';
import { arrancarServidor, carpetaTemporal, cliente, comprobador } from './servidor.mjs';

const { ok, terminar } = comprobador();

// Fechas fijas en el pasado (un mes de 2026) y una reserva futura, para que nada dependa de qué día corre la prueba.
const reserva = (id, fecha, estado, extra = {}) => ({
  id,
  tipo: 'estacion',
  recursoId: 'est-1',
  recursoNombre: 'Estación 1',
  fecha,
  hora: '09:00',
  horaFin: '11:00',
  duracion: 2,
  solicitante: 'Alguien',
  identificacion: `2019${id}`,
  codigoConfirmacion: 'ABC123',
  estado,
  creadoEn: `${fecha}T08:00:00.000-06:00`,
  ...extra,
});
const RESERVAS = [
  reserva('R-001', '2026-09-07', 'finalizado'), // lunes
  reserva('R-002', '2026-09-08', 'liberada', { motivoLiberacion: 'no_presentado', penalizadoHasta: '2026-09-10T15:15:00.000Z' }),
  reserva('R-003', '2026-09-08', 'cancelado', { tipo: 'cubiculo', recursoId: 'cub-1', recursoNombre: 'Cubículo 1' }),
  reserva('R-004', '2026-09-14', 'finalizado', { tipo: 'cubiculo', recursoId: 'cub-2', recursoNombre: 'Cubículo 2', hora: '14:00', horaFin: '15:00', duracion: 1 }),
  reserva('R-005', '2026-09-30', 'liberada', { motivoLiberacion: 'manual' }),
  reserva('R-006', '2026-10-01', 'finalizado'),
];
// Un evento a las 23:30 de Guatemala del 7 de septiembre ya es 8 de septiembre en UTC: debe contar el 7.
const evento = (id, tipo, creadoEn, extra = {}) => ({ id, tipo, kiosco: null, tesisId: null, creadoEn, ...extra });
const EVENTOS = [
  evento(1, 'busqueda_opac', '2026-09-07T15:00:00.000Z'),
  evento(2, 'busqueda_opac', '2026-09-08T05:30:00.000Z'), // 7 de septiembre, 23:30 en Guatemala
  evento(3, 'busqueda_opac', '2026-09-15T15:00:00.000Z'),
  evento(4, 'acceso_qr', '2026-09-15T16:00:00.000Z', { tesisId: 'T-2021-00045' }),
  evento(5, 'sesion_kiosco', '2026-09-08T16:00:00.000Z', { kiosco: '1' }),
  evento(6, 'busqueda_opac', '2026-10-02T15:00:00.000Z'),
];

const datos = carpetaTemporal('estadisticas');
fs.writeFileSync(path.join(datos, 'reservas.json'), JSON.stringify({ reservas: RESERVAS, contador: RESERVAS.length }));
fs.writeFileSync(path.join(datos, 'eventos.json'), JSON.stringify({ eventos: EVENTOS, contador: EVENTOS.length }));

const servidor = await arrancarServidor({ datos });
try {
  const { api, entrar } = cliente(servidor.base);
  const token = await entrar('consulta');
  const pedir = (consulta = '') => api('GET', `/admin/estadisticas${consulta}`, { token });

  console.log('Sin período: todo lo registrado');
  const todo = (await pedir()).datos;
  ok(todo.totales.busquedasOpac === 4 && todo.totales.reservasEspacios === 4 && todo.totales.reservasCubiculos === 2, `todo: 4 búsquedas, 4 reservas de espacios y 2 de cubículos (${JSON.stringify(todo.totales)})`);
  ok(todo.periodo.desde === null && todo.periodo.hasta === null, 'y dice que no hay período');

  console.log('Un día');
  const dia7 = (await pedir('?desde=2026-09-07&hasta=2026-09-07')).datos;
  ok(dia7.totales.busquedasOpac === 2, `el 7 de septiembre: 2 búsquedas, contando la de las 23:30 en hora de la biblioteca (${dia7.totales.busquedasOpac})`);
  ok(dia7.totales.reservasEspacios === 1 && dia7.reservas.atendidas === 1, `y 1 reserva atendida (${dia7.totales.reservasEspacios}, ${dia7.reservas.atendidas})`);
  ok(dia7.periodo.desde === '2026-09-07' && dia7.periodo.hasta === '2026-09-07', 'la respuesta dice qué período es');
  const dia8 = (await pedir('?desde=2026-09-08&hasta=2026-09-08')).datos;
  ok(dia8.reservas.noSePresentaron === 1 && dia8.reservas.canceladas === 1 && dia8.reservas.penalizaciones === 1, `el 8: 1 no se presentó (penalizada) y 1 cancelada (${JSON.stringify(dia8.reservas)})`);
  ok(dia8.kioscos.length === 1 && dia8.kioscos[0].sesiones === 1, 'y la sesión del kiosco 1');
  ok(dia8.totales.busquedasOpac === 0, 'la búsqueda de las 23:30 del 7 no cuenta el 8');

  console.log('Una semana');
  const semana = (await pedir('?desde=2026-09-07&hasta=2026-09-13')).datos;
  ok(semana.reservas.total === 3 && semana.reservas.horasReservadas === 4, `del 7 al 13: 3 reservas y 4 horas reservadas sin contar la cancelada (${semana.reservas.total}, ${semana.reservas.horasReservadas})`);
  ok(semana.porDia.find((d) => d.dia === 'Lunes').total === 1 && semana.porDia.find((d) => d.dia === 'Martes').total === 1, 'por día de la semana: lunes 1 y martes 1 (la cancelada no cuenta)');
  ok(semana.porHora.find((h) => h.hora === '09:00').total === 2 && semana.porHora.find((h) => h.hora === '14:00').total === 0, 'por hora: 2 a las 09:00 y ninguna a las 14:00');

  console.log('Un mes');
  const septiembre = (await pedir('?desde=2026-09-01&hasta=2026-09-30')).datos;
  ok(septiembre.reservas.total === 5 && septiembre.reservas.liberadasPorElPersonal === 1, `septiembre: 5 reservas, 1 liberada por el personal (${JSON.stringify(septiembre.reservas)})`);
  ok(septiembre.totales.busquedasOpac === 3 && septiembre.totales.accesosQr === 1, 'septiembre: 3 búsquedas y 1 acceso por QR');
  ok(septiembre.tesisMasConsultadas.some((t) => t.id === 'T-2021-00045' && t.accesosQr === 1), 'la tesis escaneada aparece entre las más consultadas del mes');
  const octubre = (await pedir('?desde=2026-10-01&hasta=2026-10-31')).datos;
  ok(octubre.reservas.total === 1 && octubre.totales.busquedasOpac === 1 && octubre.tesisMasConsultadas.length === 0, 'octubre: solo lo de octubre');

  console.log('Solo desde o solo hasta');
  ok((await pedir('?desde=2026-09-30')).datos.reservas.total === 2, 'desde el 30 de septiembre: 2 reservas');
  ok((await pedir('?hasta=2026-09-07')).datos.reservas.total === 1, 'hasta el 7 de septiembre: 1 reserva');

  console.log('Fechas mal escritas');
  const mala = await pedir('?desde=2026-13-01');
  ok(mala.estado === 400 && /no es válida/.test(mala.error ?? ''), `una fecha imposible -> 400 (${mala.estado} ${mala.error})`);
  const alReves = await pedir('?desde=2026-09-30&hasta=2026-09-01');
  ok(alReves.estado === 400, `la fecha final antes que la inicial -> 400 (${alReves.estado})`);
} finally {
  await servidor.parar();
  fs.rmSync(datos, { recursive: true, force: true });
}
terminar();
