// Pruebas de la reserva por horas (de qué hora a qué hora) en TODOS los lugares de estudio: cubículos, estaciones y sala de lectura.
// Servidor de pruebas en el puerto 4002.
const BASE = process.env.BASE || 'http://localhost:4002';
let fallos = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fallos += 1;
    console.log('  FALLA:', msg);
  } else console.log('  ok:', msg);
};

async function api(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const r = await fetch(`${BASE}/api${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let json = null;
  try {
    json = await r.json();
  } catch {
    /* sin cuerpo */
  }
  return { estado: r.status, json, datos: json?.data, mensaje: json?.message ?? json?.error ?? '' };
}

// Una fecha dentro de los próximos días con el día de la semana indicado (horas reservables de lunes a viernes: 08-11 y 14-18).
function proximoDia(diaDeLaSemana, desdeHoy = 2) {
  const d = new Date();
  d.setDate(d.getDate() + desdeHoy);
  while (d.getDay() !== diaDeLaSemana) d.setDate(d.getDate() + 1);
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
const lunes = proximoDia(1);
const martes = proximoDia(2);
const miercoles = proximoDia(3);
const jueves = proximoDia(4);

const persona = (n) => ({ solicitante: `Persona ${n}`, identificacion: `2020${String(n).padStart(5, '0')}` });
const reservar = (tipo, recursoId, fecha, hora, extra = {}, n = 1) =>
  api(`/reservas/${tipo}`, { metodo: 'POST', cuerpo: { recursoId, fecha, hora, ...persona(n), ...extra } });

const login = await api('/auth/login', { metodo: 'POST', cuerpo: { usuario: 'admin', clave: 'Admin-prueba-1' } });
const token = login.datos?.token;
ok(Boolean(token), 'entra el administrador');
const horasLibres = (lugar) => lugar.franjas.filter((f) => f.disponible).map((f) => f.hora.slice(0, 2)).join(' ');

console.log('Condiciones públicas: los topes valen para todos los lugares');
let r = await api('/reservas/condiciones');
ok(r.estado === 200 && r.datos.limites?.maxHorasPorReserva === 8 && r.datos.limites?.maxHorasPorDia === 8, `los topes llegan en «limites» (${JSON.stringify(r.datos?.limites)})`);
ok(r.datos.cubiculo === undefined && r.datos.duracionEspaciosHoras === undefined && r.datos.maxHorasPorReserva === undefined, 'ya no hay topes solo de cubículos ni «duración de espacios»');
ok(r.datos.toleranciaMinutos === 15 && r.datos.diasMaximosDeAnticipacion === 30, 'tolerancia y días de anticipación siguen igual');

console.log('Cubículos');
r = await reservar('cubiculo', 'cub-1', lunes, '08:00', { horaFin: '11:00' }, 1);
ok(r.estado === 200 && r.datos.hora === '08:00' && r.datos.horaFin === '11:00' && r.datos.duracion === 3, `cubículo 1 de 08:00 a 11:00 → 3 horas (${r.estado} ${r.mensaje})`);
const reservaDeCubiculo = r.datos;
r = await reservar('cubiculo', 'cub-1', lunes, '09:00', { horaFin: '10:00' }, 2);
ok(r.estado === 409 && /Este cubículo ya está reservado/.test(r.mensaje) && /otro cubículo/.test(r.mensaje) && /cambia la hora/.test(r.mensaje), `el aviso habla de «este cubículo» (${r.estado} ${r.mensaje})`);

console.log('Estaciones: ahora también por horas');
r = await reservar('estacion', 'est-1', lunes, '10:00', { horaFin: '12:00' }, 3);
ok(r.estado === 200 && r.datos.hora === '10:00' && r.datos.horaFin === '12:00' && r.datos.duracion === 2, `estación 1 de 10:00 a 12:00 → 2 horas (${r.estado} ${r.mensaje})`);
r = await reservar('estacion', 'est-2', lunes, '14:00', {}, 3);
ok(r.estado === 200 && r.datos.horaFin === '15:00' && r.datos.duracion === 1, 'sin hora final sigue siendo de una hora (14:00 a 15:00)');
r = await reservar('estacion', 'est-3', lunes, '14:00', { duracion: 3 }, 4);
ok(r.estado === 200 && r.datos.horaFin === '17:00' && r.datos.duracion === 3, 'también acepta la duración en horas (14:00 + 3 → 17:00)');
r = await reservar('estacion', 'est-1', lunes, '11:00', { horaFin: '12:00' }, 5);
ok(r.estado === 409 && /Esta estación ya está reservada/.test(r.mensaje) && /otra estación/.test(r.mensaje), `el aviso habla de «esta estación» (${r.estado} ${r.mensaje})`);
r = await reservar('estacion', 'est-1', lunes, '09:00', { horaFin: '11:00' }, 5);
ok(r.estado === 409, 'ni un rango que empieza libre y termina sobre uno ocupado');
r = await reservar('estacion', 'est-1', lunes, '08:00', { horaFin: '10:00' }, 5);
ok(r.estado === 200, 'pero sí uno que termina justo cuando empieza la otra reserva (08:00 a 10:00)');

console.log('Sala de lectura: sillas por horas');
r = await reservar('sala_lectura', 'sala-m1-s1', martes, '09:00', { horaFin: '12:00' }, 6);
ok(r.estado === 200 && r.datos.duracion === 3 && r.datos.horaFin === '12:00', `silla de 09:00 a 12:00 → 3 horas (${r.estado} ${r.mensaje})`);
r = await reservar('sala_lectura', 'sala-m1-s1', martes, '10:00', { horaFin: '11:00' }, 7);
ok(r.estado === 409 && /Esta silla ya está reservada/.test(r.mensaje) && /otra silla/.test(r.mensaje), `el aviso habla de «esta silla» (${r.estado} ${r.mensaje})`);
r = await reservar('sala_lectura', 'sala-m1-s2', martes, '10:00', { horaFin: '11:00' }, 7);
ok(r.estado === 200, 'la silla de al lado sí está libre');

console.log('Disponibilidad después de reservar rangos');
r = await api(`/reservas/estacion/disponibilidad?fecha=${lunes}`);
const est1 = r.datos.find((x) => x.id === 'est-1');
ok(horasLibres(est1) === '14 15 16 17 18', `la estación 1 (reservada de 08 a 12) queda libre solo por la tarde (${horasLibres(est1)})`);
ok(horasLibres(r.datos.find((x) => x.id === 'est-3')) === '08 09 10 11 17 18', `la estación 3 (14 a 17) queda libre por la mañana y de 17 a 19 (${horasLibres(r.datos.find((x) => x.id === 'est-3'))})`);
r = await api(`/reservas/sala_lectura/disponibilidad?fecha=${martes}`);
ok(horasLibres(r.datos.find((x) => x.id === 'sala-m1-s1')) === '08 14 15 16 17 18', `la silla 1 queda libre fuera de 09 a 12 (${horasLibres(r.datos.find((x) => x.id === 'sala-m1-s1'))})`);

console.log('Una persona no está en dos lugares a la vez');
r = await reservar('cubiculo', 'cub-2', miercoles, '10:00', { horaFin: '12:00' }, 8);
ok(r.estado === 200, 'persona 8: cubículo 2 de 10:00 a 12:00');
r = await reservar('estacion', 'est-5', miercoles, '11:00', { horaFin: '12:00' }, 8);
ok(r.estado === 400 && /otro lugar de estudio/.test(r.mensaje), `no puede reservar una estación en esas horas (${r.estado} ${r.mensaje})`);
r = await reservar('sala_lectura', 'sala-m2-s1', miercoles, '10:00', { horaFin: '11:00' }, 8);
ok(r.estado === 400, 'ni una silla de la sala');
r = await reservar('estacion', 'est-5', miercoles, '14:00', { horaFin: '16:00' }, 8);
ok(r.estado === 200, 'pero sí en otras horas del mismo día (14:00 a 16:00)');
r = await api('/reservas/estacion', { metodo: 'POST', cuerpo: { recursoId: 'est-6', fecha: miercoles, hora: '10:00', horaFin: '11:00', solicitante: 'Persona 8', identificacion: ' 202000008 ' } });
ok(r.estado === 400, 'el carné con espacios de más cuenta como la misma persona');
r = await api('/reservas/estacion', { metodo: 'POST', cuerpo: { recursoId: 'est-6', fecha: miercoles, hora: '10:00', horaFin: '11:00', solicitante: 'Otra', identificacion: 'AB123' } });
ok(r.estado === 200, 'persona AB123 reserva la estación 6 de 10:00 a 11:00');
r = await api('/reservas/sala_lectura', { metodo: 'POST', cuerpo: { recursoId: 'sala-m3-s1', fecha: miercoles, hora: '10:00', horaFin: '11:00', solicitante: 'Otra', identificacion: 'ab123 ' } });
ok(r.estado === 400, 'y «ab123 » (otras mayúsculas) es la misma persona');

console.log('Datos inválidos en cualquier lugar');
for (const [tipo, recursoId] of [['cubiculo', 'cub-6'], ['estacion', 'est-9'], ['sala_lectura', 'sala-m5-s6']]) {
  for (const [descripcion, extra] of [
    ['hora final con minutos', { horaFin: '10:30' }],
    ['hora final igual a la de inicio', { horaFin: '09:00' }],
    ['hora final anterior', { horaFin: '08:00' }],
    ['duración cero', { duracion: 0 }],
    ['cruzar la pausa del mediodía', { hora: '11:00', horaFin: '15:00' }],
  ]) {
    const { hora = '09:00', ...resto } = extra;
    r = await reservar(tipo, recursoId, jueves, hora, resto, 9);
    ok(r.estado === 400, `${tipo}: ${descripcion} → 400 (${r.estado})`);
  }
}
r = await api('/reservas?tipo=estacion', { token });
ok(!r.datos.some((x) => x.recursoId === 'est-9'), 'ninguna reserva inválida se guardó');

console.log('Topes que fija el administrador (valen para todos los lugares)');
r = await api('/admin/configuracion', { token });
ok(r.datos.maxHorasPorReserva === 8 && r.datos.maxHorasPorDia === 8 && r.datos.limites.horasMaximas === 12, 'la configuración trae los topes');
r = await api('/admin/configuracion', { metodo: 'PATCH', token, cuerpo: { maxHorasPorReserva: 3, maxHorasPorDia: 4 } });
ok(r.estado === 200 && r.datos.maxHorasPorReserva === 3 && r.datos.maxHorasPorDia === 4, 'el administrador fija 3 h por reserva y 4 h al día');
r = await api('/reservas/condiciones');
ok(r.datos.limites.maxHorasPorReserva === 3 && r.datos.limites.maxHorasPorDia === 4, 'las condiciones públicas ya muestran los nuevos topes');
for (const [tipo, recursoId] of [['cubiculo', 'cub-3'], ['estacion', 'est-10'], ['sala_lectura', 'sala-m4-s1']]) {
  r = await reservar(tipo, recursoId, jueves, '08:00', { horaFin: '12:00' }, 10);
  ok(r.estado === 400 && /3 horas/.test(r.mensaje), `${tipo}: más horas que el tope por reserva se rechaza (${r.estado} ${r.mensaje})`);
}
r = await reservar('estacion', 'est-10', jueves, '08:00', { horaFin: '11:00' }, 10);
ok(r.estado === 200 && r.datos.duracion === 3, 'justo el tope por reserva (3 horas) sí');
r = await reservar('cubiculo', 'cub-3', jueves, '14:00', { horaFin: '16:00' }, 10);
ok(r.estado === 400 && /4 horas de reservas al día/.test(r.mensaje) && /ya tienes 3/.test(r.mensaje), `el tope por persona al día suma todos los tipos de lugar (${r.estado} ${r.mensaje})`);
r = await reservar('sala_lectura', 'sala-m4-s1', jueves, '14:00', { horaFin: '15:00' }, 10);
ok(r.estado === 200, 'una hora más cabe dentro de las 4 del día (en otro tipo de lugar)');
r = await reservar('cubiculo', 'cub-3', jueves, '16:00', { horaFin: '17:00' }, 10);
ok(r.estado === 400, 'la quinta hora del día ya no');
r = await reservar('cubiculo', 'cub-3', jueves, '16:00', { horaFin: '17:00' }, 11);
ok(r.estado === 200, 'otra persona sí puede reservar ese mismo día');

console.log('Cancelar o liberar devuelve todas las horas');
r = await api(`/reservas/item/${reservaDeCubiculo.id}/cancelar`, { metodo: 'PATCH', token });
ok(r.estado === 200 && r.datos.estado === 'cancelado', 'se cancela la reserva de 3 horas');
r = await api(`/reservas/cubiculo/disponibilidad?fecha=${lunes}`);
ok(horasLibres(r.datos.find((x) => x.id === 'cub-1')).startsWith('08 09 10'), 'las tres horas vuelven a estar libres');

console.log('Validación de la configuración');
for (const [descripcion, cuerpo] of [
  ['por día menor que por reserva', { maxHorasPorReserva: 6, maxHorasPorDia: 5 }],
  ['cero horas', { maxHorasPorReserva: 0 }],
  ['más del máximo permitido', { maxHorasPorReserva: 13, maxHorasPorDia: 13 }],
  ['con decimales', { maxHorasPorDia: 5.5 }],
  ['texto', { maxHorasPorReserva: 'muchas' }],
]) {
  r = await api('/admin/configuracion', { metodo: 'PATCH', token, cuerpo });
  ok(r.estado === 400, `${descripcion} → 400 (${r.estado})`);
}
r = await api('/admin/configuracion', { token });
ok(r.datos.maxHorasPorReserva === 3 && r.datos.maxHorasPorDia === 4, 'los rechazos no cambian nada');
r = await api('/admin/configuracion', { metodo: 'PATCH', token, cuerpo: { maxHorasPorReserva: 8, maxHorasPorDia: 8 } });
ok(r.estado === 200, 'se restauran los topes por defecto');
r = await api('/admin/actividad?categoria=configuracion', { token });
ok(r.datos.registros.some((x) => /horas por reserva: máximo 8 → 3 h/.test(x.detalle) && /horas por persona al día: máximo 8 → 4 h/.test(x.detalle)), 'los cambios de topes quedan en la bitácora');

console.log(fallos === 0 ? '\nTODO BIEN' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
