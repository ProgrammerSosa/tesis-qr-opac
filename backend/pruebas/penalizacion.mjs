// Penalización por no presentarse: quien no llega a su reserva (se libera sola al pasar la tolerancia) queda 48 horas sin poder
// reservar ningún lugar de estudio, y sus otras reservas de ese tiempo se cancelan. Se usa un RELOJ FALSO sobre un lunes futuro.
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

process.env.DATA_DIR = path.join(os.tmpdir(), `penalizacion-${Date.now()}`);
process.env.TZ = 'America/Guatemala';
const require = createRequire(import.meta.url);
const R = require('../src/reservas/reservas_data.js');
const configuracion = require('../src/configuracion/configuracion_data.js');
const notificaciones = require('../src/notificaciones/notificaciones.js');

let fallos = 0;
let comprobaciones = 0;
const ok = (cond, msg) => {
  comprobaciones += 1;
  if (!cond) {
    fallos += 1;
    console.log('  FALLA:', msg);
  }
};
const lanza = (fn) => {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
};

const dos = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const lunes = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  return d;
})();
const dia = (masDias) => iso(new Date(lunes.getTime() + masDias * 24 * 3600 * 1000));
const LUNES = dia(0);
const MARTES = dia(1);
const MIERCOLES = dia(2);
const JUEVES = dia(3);
const a = (fecha, hora) => new Date(`${fecha}T${hora}`); // reloj falso
let lugar = 0; // las estaciones 6 a 30, una distinta cada vez (las 1 a 5 se eligen a mano)
const reservar = (persona, fecha, hora, horaFin, extra = {}) =>
  R.crearReserva({ tipo: 'estacion', recursoId: extra.recursoId ?? `est-${(lugar = (lugar % 24) + 6)}`, fecha, hora, horaFin, solicitante: 'Alguien', identificacion: persona, ...extra });

const avisos = [];
R.cuandoSePenalice((penalizada) => avisos.push(penalizada));

console.log('Quien no se presenta queda 48 horas sin reservar');
ok(configuracion.horasDePenalizacion() === 48, `por defecto son 48 horas (${configuracion.horasDePenalizacion()})`);
const falta = reservar('2019-ana', LUNES, '09:00', '10:00', { recursoId: 'est-1', correo: 'ana@ejemplo.com' });
const mismoDia = reservar('2019-ana', LUNES, '14:00', '16:00', { recursoId: 'est-2' });
const martes = reservar('2019-ana', MARTES, '10:00', '11:00', { recursoId: 'est-3' });
const jueves = reservar('2019-ana', JUEVES, '10:00', '11:00', { recursoId: 'est-4' });
const deOtra = reservar('2019-beto', MARTES, '10:00', '11:00', { recursoId: 'est-5' });

R.liberarVencidas(a(LUNES, '09:10'));
ok(R.buscarReserva(falta.id).estado === 'reservado' && !R.buscarReserva(falta.id).penalizadoHasta, 'dentro de la tolerancia todavía no pasa nada');

R.liberarVencidas(a(LUNES, '09:20'));
const liberada = R.buscarReserva(falta.id);
ok(liberada.estado === 'liberada' && liberada.motivoLiberacion === 'no_presentado', 'al pasar la tolerancia se libera por no presentarse');
ok(liberada.penalizadoHasta === a(MIERCOLES, '09:15').toISOString(), `sin reservar hasta 48 h después de vencer la tolerancia (${liberada.penalizadoHasta})`);
ok(R.buscarReserva(mismoDia.id).estado === 'cancelado' && R.buscarReserva(mismoDia.id).motivoCancelacion === 'penalizacion', 'su reserva de la tarde se cancela');
ok(R.buscarReserva(martes.id).estado === 'cancelado' && R.buscarReserva(martes.id).canceladaPorFaltaEn === falta.id, 'la del martes también, y dice por qué falta');
ok(R.buscarReserva(jueves.id).estado === 'reservado', 'la del jueves, después de las 48 h, sigue en pie');
ok(R.buscarReserva(deOtra.id).estado === 'reservado', 'las reservas de otra persona no se tocan');
ok(avisos.length === 1 && avisos[0].reserva.id === falta.id && avisos[0].canceladas.map((c) => c.id).join() === [mismoDia.id, martes.id].join(), 'se avisa una vez, con las reservas canceladas');

R.liberarVencidas(a(LUNES, '10:30'));
ok(avisos.length === 1, 'revisar otra vez no la vuelve a penalizar');

const rechazo = lanza(() => reservar('2019-ana', JUEVES, '14:00', '15:00'));
ok(rechazo?.estado === 403 && /No puedes reservar hasta el/.test(rechazo.message) && rechazo.message.includes(falta.id), `no puede hacer reservas nuevas (${rechazo?.estado}: ${rechazo?.message})`);
ok(lanza(() => reservar(' 2019-ANA ', JUEVES, '14:00', '15:00'))?.estado === 403, 'aunque escriba su carné con mayúsculas o espacios');
ok(!lanza(() => reservar('2019-beto', JUEVES, '14:00', '15:00')), 'otra persona sí puede reservar');

const lista = R.penalizaciones(a(LUNES, '10:30'));
ok(lista.length === 1 && lista[0].identificacion === '2019-ana' && lista[0].canceladas.length === 2, 'el personal ve la penalización y cuántas reservas se cancelaron');
const deAna = (ahora) => R.penalizaciones(ahora).filter((p) => p.identificacion === '2019-ana');
ok(deAna(a(MIERCOLES, '09:14')).length === 1 && deAna(a(MIERCOLES, '09:16')).length === 0, 'después de las 48 h ya no aparece');

console.log('El correo que le llega');
const correo = notificaciones.mensajeDeNoPresentado(liberada, avisos[0].canceladas);
ok(/No te presentaste/.test(correo.asunto) && correo.texto.includes('48 horas') && correo.texto.includes(martes.id), 'dice hasta cuándo, las 48 horas y qué reservas se cancelaron');
ok(notificaciones.mensajeDeReserva(jueves).texto.includes('no podrás reservar ningún lugar de estudio durante 48 horas'), 'el comprobante de cada reserva avisa del castigo');

console.log('El personal puede quitarla');
ok(lanza(() => R.quitarPenalizacion(jueves.id, { usuario: 'circulacion' }))?.estado === 409, 'una reserva sin penalización no tiene nada que quitar');
const quitada = R.quitarPenalizacion(falta.id, { usuario: 'circulacion' });
ok(quitada.penalizacionQuitada?.por === 'circulacion', 'queda anotado quién la quitó');
ok(!lanza(() => reservar('2019-ana', JUEVES, '16:00', '17:00')), 'y la persona ya puede reservar');
ok(deAna(a(LUNES, '10:30')).length === 0, 'ya no aparece en la lista');

console.log('Lo que no se castiga');
const avisada = reservar('2019-carla', MARTES, '09:00', '10:00');
R.liberarReserva(avisada.id);
R.liberarVencidas(a(MARTES, '09:30'));
ok(!R.buscarReserva(avisada.id).penalizadoHasta && !R.penalizacionDe('2019-carla'), 'si el personal la liberó a mano (avisó que no llegaba), no hay castigo');

const llego = reservar('2019-dani', MARTES, '09:00', '10:00');
R.avanzarEstado(llego.id, a(MARTES, '09:05'));
R.liberarVencidas(a(MARTES, '10:30'));
ok(R.buscarReserva(llego.id).estado === 'finalizado' && !R.penalizacionDe('2019-dani'), 'quien llegó a tiempo no queda penalizado');

configuracion.actualizar({ horasDePenalizacion: 0 }, { usuario: 'admin' });
const sinCastigo = reservar('2019-eva', MARTES, '11:00', '12:00');
R.liberarVencidas(a(MARTES, '11:30'));
ok(R.buscarReserva(sinCastigo.id).estado === 'liberada' && !R.penalizacionDe('2019-eva'), 'con 0 horas en la configuración se libera, pero no hay castigo');
ok(!notificaciones.mensajeDeReserva(sinCastigo).texto.includes('no podrás reservar'), 'y el comprobante ya no lo menciona');

console.log('La configuración');
ok(lanza(() => configuracion.actualizar({ horasDePenalizacion: 200 }))?.estado === 400, 'no acepta más de una semana');
ok(lanza(() => configuracion.actualizar({ horasDePenalizacion: 1.5 }))?.estado === 400, 'ni horas con decimales');
const { cambios } = configuracion.actualizar({ horasDePenalizacion: 24 }, { usuario: 'admin' });
ok(cambios.some((c) => /0 → 24 h/.test(c)) && configuracion.obtener().horasDePenalizacion === 24, `el cambio queda en la bitácora (${cambios.join('; ')})`);

console.log(`${comprobaciones} comprobaciones: ${fallos === 0 ? 'TODO BIEN' : `${fallos} FALLAS`}`);
process.exit(fallos === 0 ? 0 : 1);
