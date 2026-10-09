// Pruebas de la lógica de reservas con un RELOJ FALSO: salida anticipada, cierre automático, liberación por no presentarse,
// cancelaciones y ocupación. Se crean reservas para un lunes futuro y se simula la hora de ese lunes.
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

process.env.DATA_DIR = path.join(os.tmpdir(), `salida-${Date.now()}`);
process.env.TZ = 'America/Guatemala';
const require = createRequire(import.meta.url);
const R = require('../src/reservas/reservas_data.js');

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
const LUNES = iso(lunes);
const MARTES = iso(new Date(lunes.getTime() + 24 * 3600 * 1000));
const a = (fecha, hora) => new Date(`${fecha}T${hora}`); // reloj falso
let n = 0;
const reservar = (tipo, recursoId, hora, horaFin, persona = `persona-${(n += 1)}`) =>
  R.crearReserva({ tipo, recursoId, fecha: LUNES, hora, horaFin, solicitante: 'Alguien', identificacion: persona });

console.log('Salida anticipada: las horas que no usó quedan libres');
let r = reservar('cubiculo', 'cub-1', '09:00', '12:00', 'ana');
R.avanzarEstado(r.id, a(LUNES, '09:05:00'));
ok(r.estado === 'en_uso' && r.ingresoEn, 'sellar el ingreso la deja en uso y anota la hora');
R.avanzarEstado(r.id, a(LUNES, '10:20:00'));
ok(r.estado === 'finalizado', 'sellar la salida la finaliza');
ok(r.horaFin === '11:00' && r.horaFinOriginal === '12:00' && r.duracion === 2 && r.salioAntes === true, `se recorta a 11:00 y recuerda las 12:00 (${r.horaFin}, ${r.horaFinOriginal}, ${r.duracion} h)`);
ok(typeof r.salidaEn === 'string', 'anota la hora de salida');
let disp = R.disponibilidad('cubiculo', LUNES).find((x) => x.id === 'cub-1');
const libre = (hora) => disp.franjas.find((f) => f.hora === hora).disponible;
ok(!libre('09:00') && !libre('10:00') && libre('11:00'), 'las dos horas usadas siguen ocupadas y la de las 11:00 queda libre');
const otra = reservar('cubiculo', 'cub-1', '11:00', '12:00', 'beto');
ok(otra.estado === 'reservado', 'otra persona ya puede reservar esa hora liberada');

console.log('Los casos del borde');
r = reservar('cubiculo', 'cub-2', '09:00', '11:00', 'carla');
R.avanzarEstado(r.id, a(LUNES, '09:00:00'));
R.avanzarEstado(r.id, a(LUNES, '10:00:00'));
ok(r.horaFin === '10:00' && r.salioAntes, 'salir justo a las 10:00 libera la hora de las 10:00');
r = reservar('cubiculo', 'cub-3', '09:00', '11:00', 'dario');
R.avanzarEstado(r.id, a(LUNES, '09:00:00'));
R.avanzarEstado(r.id, a(LUNES, '10:00:30'));
ok(r.horaFin === '11:00' && !r.salioAntes, 'salir a las 10:00:30 ya usó esa hora: no libera nada');
r = reservar('cubiculo', 'cub-4', '09:00', '11:00', 'elena');
R.avanzarEstado(r.id, a(LUNES, '09:00:00'));
R.avanzarEstado(r.id, a(LUNES, '10:30:00'));
ok(r.horaFin === '11:00' && !r.salioAntes && r.estado === 'finalizado', 'salir en la última hora no es salir antes');
r = reservar('cubiculo', 'cub-5', '09:00', '12:00', 'fabio');
R.avanzarEstado(r.id, a(LUNES, '09:00:00'));
R.avanzarEstado(r.id, a(LUNES, '09:10:00'));
ok(r.horaFin === '10:00' && r.duracion === 1, 'quien se va a los 10 minutos conserva una hora y libera las otras dos');
r = reservar('cubiculo', 'cub-6', '10:00', '12:00', 'gina');
R.avanzarEstado(r.id, a(LUNES, '09:40:00'));
R.avanzarEstado(r.id, a(LUNES, '09:50:00'));
ok(r.horaFin === '11:00' && r.duracion === 1, 'quien entra y sale antes de su hora conserva una hora');
r = reservar('estacion', 'est-1', '09:00', '12:00', 'hugo');
R.avanzarEstado(r.id, a(LUNES, '09:00:00'));
R.avanzarEstado(r.id, a(MARTES, '08:00:00')); // el día siguiente: ya se había cerrado sola
ok(r.estado === 'finalizado' && r.salidaAutomatica === true && r.horaFin === '12:00' && !r.salioAntes, 'una reserva de otro día no libera nada al sellar');

console.log('La persona liberó horas: su tope del día baja');
// Tope por defecto: 8 horas al día por persona. Zoe reserva 4 h de la mañana y se va a las 9:20, así que solo usó 2.
r = reservar('estacion', 'est-10', '08:00', '12:00', 'zoe');
R.avanzarEstado(r.id, a(LUNES, '08:00:00'));
R.avanzarEstado(r.id, a(LUNES, '09:20:00'));
ok(r.duracion === 2 && r.horaFin === '10:00', 'zoe se fue y quedó con 2 horas usadas de las 4 reservadas');
const tarde = reservar('estacion', 'est-11', '14:00', '19:00', 'zoe'); // 2 + 5 = 7 de 8 (sin el recorte serían 9 y se rechazaría)
ok(tarde.estado === 'reservado', 'con las horas liberadas, zoe puede reservar 5 h más esa tarde');
const pasaDelTope = lanza(() => reservar('estacion', 'est-13', '10:00', '12:00', 'zoe'));
ok(pasaDelTope?.message.includes('Superarías el máximo de 8 horas') && pasaDelTope.message.includes('ya tienes 7'), `y 2 más ya pasarían del tope (${pasaDelTope?.message})`);

console.log('Cierre automático y liberación por no presentarse');
r = reservar('estacion', 'est-3', '09:00', '10:00', 'ines');
R.avanzarEstado(r.id, a(LUNES, '09:10:00'));
R.liberarVencidas(a(LUNES, '09:59:59'));
ok(r.estado === 'en_uso', 'antes de que termine su hora sigue en uso');
R.liberarVencidas(a(LUNES, '10:00:01'));
ok(r.estado === 'finalizado' && r.salidaAutomatica === true && r.salidaEn === a(LUNES, '10:00:00').toISOString(), 'al terminar su hora se finaliza sola, con la salida a la hora de fin');
r = reservar('estacion', 'est-4', '09:00', '10:00', 'jose');
R.liberarVencidas(a(LUNES, '09:14:59'));
ok(r.estado === 'reservado', 'dentro de la tolerancia sigue esperando');
R.liberarVencidas(a(LUNES, '09:15:01'));
ok(r.estado === 'liberada' && r.motivoLiberacion === 'no_presentado', 'pasada la tolerancia se libera sola');

console.log('Cancelar');
r = reservar('estacion', 'est-5', '15:00', '16:00', 'karla');
const cancelada = R.cancelarReserva(r.id);
ok(cancelada.estado === 'cancelado' && cancelada.canceladaEn, 'una reservada se cancela y anota cuándo');
let e = lanza(() => R.cancelarReserva(r.id));
ok(e?.estado === 409, 'cancelar otra vez la misma da 409');
r = reservar('estacion', 'est-6', '15:00', '16:00', 'luis');
R.avanzarEstado(r.id, a(LUNES, '15:00:00'));
ok(R.cancelarReserva(r.id).estado === 'cancelado', 'una en uso también se puede cancelar');
r = reservar('estacion', 'est-7', '15:00', '16:00', 'mia');
R.avanzarEstado(r.id, a(LUNES, '15:00:00'));
R.avanzarEstado(r.id, a(LUNES, '15:30:00'));
e = lanza(() => R.cancelarReserva(r.id));
ok(e?.estado === 409 && r.estado === 'finalizado', 'una finalizada no se puede cancelar (es historia)');
const liberadaAntes = reservar('estacion', 'est-8', '15:00', '16:00', 'nora');
R.liberarReserva(liberadaAntes.id);
e = lanza(() => R.cancelarReserva(liberadaAntes.id));
ok(e?.estado === 409, 'una liberada tampoco');
ok(R.cancelarReserva('R-999999') === null, 'una que no existe devuelve null');
e = lanza(() => R.liberarReserva(r.id));
ok(e?.estado === 409, 'liberar una finalizada da 409');

console.log('Ocupación de esta hora');
const o1 = reservar('cubiculo', 'cub-1', '16:00', '18:00', 'omar');
const o2 = reservar('cubiculo', 'cub-2', '16:00', '17:00', 'paula');
const o3 = reservar('cubiculo', 'cub-3', '17:00', '18:00', 'quique');
const o4 = reservar('sala_lectura', 'sala-m1-s1', '16:00', '17:00', 'rosa');
R.avanzarEstado(o1.id, a(LUNES, '16:02:00'));
const ocupacion = R.ocupacionAhora(a(LUNES, '16:20:00'));
ok(ocupacion.cubiculo.total === 6 && ocupacion.estacion.total === 30 && ocupacion.sala_lectura.total === 30, 'trae el total de cada tipo');
ok(ocupacion.cubiculo.enUso === 1 && ocupacion.cubiculo.esperando === 1, `cubículos a las 16:20: 1 en uso y 1 esperando, no cuenta el que empieza a las 17:00 (${JSON.stringify(ocupacion.cubiculo)})`);
ok(ocupacion.sala_lectura.esperando === 1 && ocupacion.sala_lectura.enUso === 0, 'una silla de la sala esperando');
ok(R.ocupacionAhora(a(LUNES, '17:20:00')).cubiculo.esperando === 1, 'a las 17:20 cuenta el que empezó a las 17:00 (los de las 16:00 ya no)');
ok(R.ocupacionAhora(a(MARTES, '16:20:00')).cubiculo.enUso === 0, 'otro día no hay nada');
void o2; void o3; void o4;

console.log(`\n${comprobaciones} comprobaciones: ${fallos === 0 ? 'TODO BIEN' : `${fallos} FALLAS`}`);
process.exit(fallos === 0 ? 0 : 1);
