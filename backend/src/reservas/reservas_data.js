const { RECURSOS, FRANJAS, REGLAS_CUBICULO, CONDICIONES } = require('./recursos_data');
const { generarCodigoConfirmacion, correoValido } = require('../../utils/codigos');

// Almacenamiento en memoria: suficiente para esta propuesta de diseño (Anexo 3).
// Un backend definitivo cambiaria estas funciones por consultas a una base de datos,
// sin que las rutas ni el frontend tengan que cambiar.
const reservas = [];
let contador = 0;

function siguienteCodigo() {
  contador += 1;
  return String(contador).padStart(3, '0');
}

function recursosDe(tipo) {
  return RECURSOS[tipo] || [];
}

// Error con el código HTTP que debe devolver el controlador.
function rechazo(mensaje, estado = 400) {
  const error = new Error(mensaje);
  error.estado = estado;
  return error;
}

// Una reserva cancelada o liberada (por no presentarse o por decisión del personal) ya no ocupa el lugar
// ni cuenta para el tope diario de la persona.
const ESTADOS_SIN_OCUPAR = ['cancelado', 'liberada'];
const vigente = (r) => !ESTADOS_SIN_OCUPAR.includes(r.estado);

// Franjas que cubre una reserva: `duracion` horas seguidas a partir de `hora`.
function franjasCubiertas(hora, duracion) {
  const inicio = FRANJAS.indexOf(hora);
  return inicio === -1 ? [] : FRANJAS.slice(inicio, inicio + duracion);
}

function franjasDeReserva(reserva) {
  return franjasCubiertas(reserva.hora, reserva.duracion);
}

function horaFinal(franjas) {
  const ultima = Number(franjas[franjas.length - 1].slice(0, 2));
  return `${String(ultima + 1).padStart(2, '0')}:00`;
}

function inicioDeReserva(reserva) {
  const [anio, mes, dia] = reserva.fecha.split('-').map(Number);
  const [hora, minuto] = reserva.hora.split(':').map(Number);
  return new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
}

// Si quien reservó no se presenta dentro de la tolerancia (no se "sella el ingreso"), la reserva se libera
// sola y el lugar vuelve a estar disponible (propuesta, sección 4.5.2). Se revisa cada vez que se consulta.
function liberarVencidas(ahora = new Date()) {
  const tolerancia = CONDICIONES.toleranciaMinutos * 60 * 1000;
  reservas.forEach((reserva) => {
    if (reserva.estado === 'reservado' && ahora.getTime() >= inicioDeReserva(reserva).getTime() + tolerancia) {
      reserva.estado = 'liberada';
      reserva.liberadaEn = ahora.toISOString();
      reserva.motivoLiberacion = 'no_presentado';
    }
  });
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

function disponibilidad(tipo, fecha) {
  liberarVencidas();
  return recursosDe(tipo).map((recurso) => {
    const ocupadas = horasOcupadas(tipo, recurso.id, fecha);
    return {
      ...recurso,
      franjas: FRANJAS.map((hora) => ({ hora, disponible: !ocupadas.includes(hora) })),
    };
  });
}

// Reglas de los cubículos: cada tipo de reserva aplica a ciertos cubículos, tiene una duración
// permitida y un máximo de horas al día por persona.
function validarCubiculo({ recurso, fecha, modalidad, duracion, identificacion }) {
  const regla = REGLAS_CUBICULO[modalidad];
  if (!regla) {
    throw rechazo('Elige el tipo de reserva del cubículo');
  }
  if (!recurso.modalidades.includes(modalidad)) {
    throw rechazo(`El ${recurso.nombre} no está habilitado para ${regla.nombre.toLowerCase()}`);
  }

  const horas = Number(duracion);
  if (!Number.isInteger(horas) || horas < regla.minHoras || horas > regla.maxHoras) {
    const rango = regla.minHoras === regla.maxHoras ? `de ${regla.minHoras} horas` : `de ${regla.minHoras} a ${regla.maxHoras} horas`;
    throw rechazo(`La reserva para ${regla.nombre.toLowerCase()} debe ser ${rango}`);
  }

  const yaReservadas = reservas
    .filter(
      (r) =>
        r.tipo === 'cubiculo' &&
        r.modalidad === modalidad &&
        r.identificacion === identificacion &&
        r.fecha === fecha &&
        vigente(r)
    )
    .reduce((total, r) => total + r.duracion, 0);
  if (yaReservadas + horas > regla.maxDiarias) {
    throw rechazo(
      `Superarías el máximo de ${regla.maxDiarias} horas diarias para ${regla.nombre.toLowerCase()} (ya tienes ${yaReservadas})`
    );
  }

  return { regla, horas };
}

function kioscoValido(kiosco) {
  return typeof kiosco === 'string' && /^[0-9A-Za-z_-]{1,10}$/.test(kiosco) ? kiosco : null;
}

function crearReserva({ tipo, recursoId, fecha, hora, solicitante, identificacion, correo, kiosco, modalidad, duracion }) {
  liberarVencidas();
  const recurso = recursosDe(tipo).find((r) => r.id === recursoId);
  if (!recurso) {
    throw rechazo('Ese recurso no existe', 404);
  }
  if (!FRANJAS.includes(hora)) {
    throw rechazo('Esa hora no está disponible para reservar');
  }

  const documento = String(identificacion || '').trim();
  if (!documento) {
    throw rechazo('Indica tu carné, correo institucional o documento para reservar');
  }
  const correoLimpio = String(correo || '').trim();
  if (correoLimpio && !correoValido(correoLimpio)) {
    throw rechazo('El correo no es válido');
  }

  let horas = 1;
  let regla = null;
  if (tipo === 'cubiculo') {
    ({ regla, horas } = validarCubiculo({ recurso, fecha, modalidad, duracion, identificacion: documento }));
  }

  const cubiertas = franjasCubiertas(hora, horas);
  if (cubiertas.length < horas) {
    throw rechazo('El horario elegido no alcanza para esa duración');
  }
  const ocupadas = horasOcupadas(tipo, recursoId, fecha);
  if (cubiertas.some((franja) => ocupadas.includes(franja))) {
    throw rechazo('Ese horario ya fue reservado, elige otro', 409);
  }
  if (regla && cubiertas.some((franja) => horasDePersona(documento, fecha).includes(franja))) {
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
    ...(regla ? { modalidad, modalidadNombre: regla.nombre } : {}),
    solicitante,
    identificacion: documento,
    ...(correoLimpio ? { correo: correoLimpio } : {}),
    ...(kioscoValido(kiosco) ? { kiosco: kioscoValido(kiosco) } : {}),
    codigoConfirmacion: generarCodigoConfirmacion(),
    estado: 'reservado',
    creadoEn: new Date().toISOString(),
  };
  reservas.push(reserva);
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
  return reserva;
}

function cancelarReserva(id) {
  const reserva = buscarReserva(id);
  if (!reserva) return null;
  reserva.estado = 'cancelado';
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
  return reserva;
}

function resumen() {
  liberarVencidas();
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    total: reservas.length,
    hoy: reservas.filter((r) => r.fecha === hoy).length,
    activas: reservas.filter((r) => ['reservado', 'en_uso'].includes(r.estado)).length,
    liberadas: reservas.filter((r) => r.estado === 'liberada').length,
  };
}

module.exports = {
  recursosDe,
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
