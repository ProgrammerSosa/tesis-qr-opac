const { RECURSOS, CONDICIONES } = require('./recursos_data');
const configuracion = require('../configuracion/configuracion_data');
const horarios = require('../horarios/horarios_data');
const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');
const { esFechaISO, fechaLocal, minutosDelDia, sumarDias } = require('../../utils/fechas');
const { generarCodigoConfirmacion, correoValido } = require('../../utils/codigos');

// Las reservas se guardan en el almacén de datos (ver utils/almacen.js): no se pierden al reiniciar el servidor.
const estado = almacen.cargar('reservas', { reservas: [], contador: 0 });
const reservas = estado.reservas;

function guardar() {
  almacen.guardar('reservas', estado);
}

function siguienteCodigo() {
  estado.contador += 1;
  return String(estado.contador).padStart(3, '0');
}

function recursosDe(tipo) {
  return RECURSOS[tipo] || [];
}

// Una reserva cancelada o liberada (por no presentarse o por decisión del personal) ya no ocupa el lugar
// ni cuenta para el tope diario de la persona.
const ESTADOS_SIN_OCUPAR = ['cancelado', 'liberada'];
const vigente = (r) => !ESTADOS_SIN_OCUPAR.includes(r.estado);

const horaEntera = (numero) => `${String(numero).padStart(2, '0')}:00`;

// Horas que ocupa una reserva ya hecha: `duracion` horas seguidas desde `hora`. Se calcula sin mirar los horarios
// de hoy, porque el administrador puede cambiarlos después y una reserva existente no debe dejar de ocupar su lugar.
function franjasDeReserva(reserva) {
  const inicio = Number(reserva.hora.slice(0, 2));
  return Array.from({ length: reserva.duracion }, (_, i) => horaEntera(inicio + i));
}

// Horas que cubriría una reserva nueva si cabe en el horario de ese día: `duracion` horas seguidas desde `hora`, todas
// dentro de las horas reservables (las que dejan fuera, por ejemplo, el cierre del mediodía). Si no cabe, devuelve menos.
function franjasCubiertas(fecha, hora, duracion) {
  const delDia = horarios.franjasDeReserva(fecha);
  if (!delDia.includes(hora)) return [];
  const inicio = Number(hora.slice(0, 2));
  const cubiertas = [];
  for (let i = 0; i < duracion && delDia.includes(horaEntera(inicio + i)); i += 1) {
    cubiertas.push(horaEntera(inicio + i));
  }
  return cubiertas;
}

function horaFinal(franjas) {
  return horaEntera(Number(franjas[franjas.length - 1].slice(0, 2)) + 1);
}

function inicioDeReserva(reserva) {
  const [anio, mes, dia] = reserva.fecha.split('-').map(Number);
  const [hora, minuto] = reserva.hora.split(':').map(Number);
  return new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
}

// Si quien reservó no se presenta dentro de la tolerancia (no se "sella el ingreso"), la reserva se libera
// sola y el lugar vuelve a estar disponible (propuesta, sección 4.5.2). Se revisa cada vez que se consulta.
// Los minutos de tolerancia los fija el administrador en la configuración.
function liberarVencidas(ahora = new Date()) {
  const tolerancia = configuracion.toleranciaMinutos() * 60 * 1000;
  let huboCambios = false;
  reservas.forEach((reserva) => {
    if (reserva.estado === 'reservado' && ahora.getTime() >= inicioDeReserva(reserva).getTime() + tolerancia) {
      reserva.estado = 'liberada';
      reserva.liberadaEn = ahora.toISOString();
      reserva.motivoLiberacion = 'no_presentado';
      huboCambios = true;
    }
  });
  if (huboCambios) guardar();
}

function horasOcupadas(tipo, recursoId, fecha) {
  return reservas
    .filter((r) => r.tipo === tipo && r.recursoId === recursoId && r.fecha === fecha && vigente(r))
    .flatMap(franjasDeReserva);
}

// Franjas en las que una persona ya tiene un cubículo reservado ese día.
function horasDePersona(identificacion, fecha) {
  return reservas
    .filter((r) => r.tipo === 'cubiculo' && r.identificacion === identificacion && r.fecha === fecha && vigente(r))
    .flatMap(franjasDeReserva);
}

// Cada lugar con las horas de ese día y si están libres. Los días de cierre y las horas fuera de las ventanas de reserva
// no aparecen: si la biblioteca no atiende, la lista de horas viene vacía.
function disponibilidad(tipo, fecha) {
  liberarVencidas();
  const delDia = horarios.franjasDeReserva(fecha);
  return recursosDe(tipo).map((recurso) => {
    const ocupadas = horasOcupadas(tipo, recurso.id, fecha);
    return {
      ...recurso,
      franjas: delDia.map((hora) => ({ hora, disponible: !ocupadas.includes(hora) })),
    };
  });
}

// Cuántas horas dura una reserva de cubículo: se elige desde qué hora hasta qué hora (`horaFin`, una hora entera, p. ej. "13:00"),
// o se indica la duración en horas (`duracion`). Sin ninguna de las dos es de una hora.
function horasDeCubiculo({ hora, horaFin, duracion }) {
  if (horaFin !== undefined && horaFin !== null && horaFin !== '') {
    if (!/^([01]\d|2[0-3]):00$/.test(String(horaFin))) {
      throw rechazo('La hora final debe ser una hora entera, por ejemplo 13:00');
    }
    const horas = Number(String(horaFin).slice(0, 2)) - Number(hora.slice(0, 2));
    if (horas < 1) {
      throw rechazo('La hora final debe ser posterior a la hora de inicio');
    }
    return horas;
  }
  if (duracion === undefined || duracion === null || duracion === '') return 1;
  const horas = Number(duracion);
  if (!Number.isInteger(horas) || horas < 1) {
    throw rechazo('La duración de la reserva debe ser de al menos una hora');
  }
  return horas;
}

// Reglas de los cubículos: por horas enteras, hasta un máximo de horas por reserva y por persona al día (el administrador
// los fija en la configuración).
function validarCubiculo({ fecha, horas, identificacion }) {
  const { maxHorasPorReserva, maxHorasPorDia } = configuracion.limitesDeCubiculo();
  if (horas > maxHorasPorReserva) {
    throw rechazo(`Un cubículo se reserva por ${maxHorasPorReserva} horas como máximo; elige una hora final más cercana`);
  }

  const yaReservadas = reservas
    .filter((r) => r.tipo === 'cubiculo' && r.identificacion === identificacion && r.fecha === fecha && vigente(r))
    .reduce((total, r) => total + r.duracion, 0);
  if (yaReservadas + horas > maxHorasPorDia) {
    throw rechazo(
      `Superarías el máximo de ${maxHorasPorDia} horas de cubículo al día por persona (ya tienes ${yaReservadas}). Elige menos horas u otro día.`
    );
  }
}

function kioscoValido(kiosco) {
  return typeof kiosco === 'string' && /^[0-9A-Za-z_-]{1,10}$/.test(kiosco) ? kiosco : null;
}

function crearReserva({ tipo, recursoId, fecha, hora, horaFin, solicitante, identificacion, correo, kiosco, duracion }) {
  liberarVencidas();
  if (configuracion.reservasPausadas(tipo)) {
    throw rechazo(configuracion.mensajeDePausa(tipo), 503);
  }
  const recurso = recursosDe(tipo).find((r) => r.id === recursoId);
  if (!recurso) {
    throw rechazo('Ese recurso no existe', 404);
  }
  if (!esFechaISO(fecha)) {
    throw rechazo('La fecha de la reserva no es válida');
  }
  // No se reserva en el pasado ni demasiado adelante. Una hora de hoy se puede reservar mientras no se acabe su tolerancia:
  // después, la reserva se liberaría sola al instante.
  const hoy = fechaLocal();
  if (fecha < hoy) {
    throw rechazo('No puedes reservar en una fecha que ya pasó');
  }
  if (fecha > sumarDias(hoy, CONDICIONES.diasMaximosDeAnticipacion)) {
    throw rechazo(`Solo puedes reservar hasta ${CONDICIONES.diasMaximosDeAnticipacion} días adelante`);
  }
  const cierre = horarios.cierreDe(fecha);
  if (cierre) {
    throw rechazo(`La biblioteca está cerrada ese día (${cierre.motivo}). Elige otra fecha.`, 409);
  }
  if (!horarios.franjasDeReserva(fecha).includes(hora)) {
    throw rechazo('Esa hora no está dentro del horario de reservas de ese día');
  }
  if (fecha === hoy && minutosDelDia() >= Number(hora.slice(0, 2)) * 60 + configuracion.toleranciaMinutos()) {
    throw rechazo('Esa hora ya pasó: elige una hora posterior');
  }

  const documento = String(identificacion || '').trim();
  if (!documento) {
    throw rechazo('Indica tu carné, correo institucional o documento para reservar');
  }
  const correoLimpio = String(correo || '').trim();
  if (correoLimpio && !correoValido(correoLimpio)) {
    throw rechazo('El correo no es válido');
  }

  // Los cubículos se reservan por horas (de la hora de inicio a la hora final); estaciones y sillas, una hora.
  const esCubiculo = tipo === 'cubiculo';
  const horas = esCubiculo ? horasDeCubiculo({ hora, horaFin, duracion }) : 1;
  if (esCubiculo) {
    validarCubiculo({ fecha, horas, identificacion: documento });
  }

  const cubiertas = franjasCubiertas(fecha, hora, horas);
  if (cubiertas.length < horas) {
    throw rechazo('Ese horario no cabe en el horario de reservas de ese día: la reserva debe quedar dentro de las horas que se ofrecen (sin cruzar la pausa del mediodía)');
  }
  const ocupadas = horasOcupadas(tipo, recursoId, fecha);
  if (cubiertas.some((franja) => ocupadas.includes(franja))) {
    throw rechazo(
      esCubiculo
        ? 'Este cubículo ya está reservado en ese horario. Intenta con otro cubículo o cambia la hora.'
        : 'Ese lugar ya está reservado a esa hora. Intenta con otro lugar o cambia la hora.',
      409
    );
  }
  if (esCubiculo && cubiertas.some((franja) => horasDePersona(documento, fecha).includes(franja))) {
    throw rechazo('Ya tienes otro cubículo reservado en ese horario');
  }

  const reserva = {
    id: `R-${siguienteCodigo()}`,
    tipo,
    recursoId,
    recursoNombre: recurso.nombre,
    fecha,
    hora,
    horaFin: horaFinal(cubiertas),
    duracion: horas,
    solicitante,
    identificacion: documento,
    ...(correoLimpio ? { correo: correoLimpio } : {}),
    ...(kioscoValido(kiosco) ? { kiosco: kioscoValido(kiosco) } : {}),
    codigoConfirmacion: generarCodigoConfirmacion(),
    estado: 'reservado',
    creadoEn: new Date().toISOString(),
  };
  reservas.push(reserva);
  guardar();
  return reserva;
}

function listarReservas({ tipo } = {}) {
  liberarVencidas();
  return reservas
    .filter((r) => !tipo || r.tipo === tipo)
    .slice()
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

function buscarReserva(id) {
  return reservas.find((r) => r.id === id) || null;
}

const SIGUIENTE_ESTADO = { reservado: 'en_uso', en_uso: 'finalizado' };

function avanzarEstado(id) {
  liberarVencidas();
  const reserva = buscarReserva(id);
  if (!reserva) return null;
  const siguiente = SIGUIENTE_ESTADO[reserva.estado];
  if (!siguiente) return reserva;
  reserva.estado = siguiente;
  guardar();
  return reserva;
}

function cancelarReserva(id) {
  const reserva = buscarReserva(id);
  if (!reserva) return null;
  reserva.estado = 'cancelado';
  guardar();
  return reserva;
}

// El personal libera a mano un lugar reservado (por ejemplo, si avisaron que no llegarán):
// vuelve a estar disponible para los usuarios.
function liberarReserva(id) {
  liberarVencidas();
  const reserva = buscarReserva(id);
  if (!reserva) return null;
  if (reserva.estado !== 'reservado') {
    throw rechazo('Solo se puede liberar una reserva que sigue en estado reservado', 409);
  }
  reserva.estado = 'liberada';
  reserva.liberadaEn = new Date().toISOString();
  reserva.motivoLiberacion = 'manual';
  guardar();
  return reserva;
}

function resumen() {
  liberarVencidas();
  const hoy = fechaLocal();
  return {
    total: reservas.length,
    hoy: reservas.filter((r) => r.fecha === hoy).length,
    activas: reservas.filter((r) => ['reservado', 'en_uso'].includes(r.estado)).length,
    liberadas: reservas.filter((r) => r.estado === 'liberada').length,
  };
}

module.exports = {
  recursosDe,
  liberarVencidas,
  disponibilidad,
  crearReserva,
  listarReservas,
  buscarReserva,
  avanzarEstado,
  cancelarReserva,
  liberarReserva,
  franjasDeReserva,
  resumen,
};
