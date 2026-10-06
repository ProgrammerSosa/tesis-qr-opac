const { RECURSOS, FRANJAS, REGLAS_CUBICULO } = require('./recursos_data');

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

// Franjas que cubre una reserva: `duracion` horas seguidas a partir de `hora`.
function franjasCubiertas(hora, duracion) {
  const inicio = FRANJAS.indexOf(hora);
  return inicio === -1 ? [] : FRANJAS.slice(inicio, inicio + duracion);
}

function horaFinal(franjas) {
  const ultima = Number(franjas[franjas.length - 1].slice(0, 2));
  return `${String(ultima + 1).padStart(2, '0')}:00`;
}

function horasOcupadas(tipo, recursoId, fecha) {
  return reservas
    .filter((r) => r.tipo === tipo && r.recursoId === recursoId && r.fecha === fecha && r.estado !== 'cancelado')
    .flatMap((r) => franjasCubiertas(r.hora, r.duracion));
}

// Franjas en las que una persona ya tiene un cubículo reservado ese día.
function horasDePersona(identificacion, fecha) {
  return reservas
    .filter((r) => r.tipo === 'cubiculo' && r.identificacion === identificacion && r.fecha === fecha && r.estado !== 'cancelado')
    .flatMap((r) => franjasCubiertas(r.hora, r.duracion));
}

function disponibilidad(tipo, fecha) {
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

  if (!identificacion) {
    throw rechazo('Indica tu código o documento para reservar un cubículo');
  }
  const yaReservadas = reservas
    .filter(
      (r) =>
        r.tipo === 'cubiculo' &&
        r.modalidad === modalidad &&
        r.identificacion === identificacion &&
        r.fecha === fecha &&
        r.estado !== 'cancelado'
    )
    .reduce((total, r) => total + r.duracion, 0);
  if (yaReservadas + horas > regla.maxDiarias) {
    throw rechazo(
      `Superarías el máximo de ${regla.maxDiarias} horas diarias para ${regla.nombre.toLowerCase()} (ya tienes ${yaReservadas})`
    );
  }

  return { regla, horas };
}

function crearReserva({ tipo, recursoId, fecha, hora, solicitante, identificacion, modalidad, duracion }) {
  const recurso = recursosDe(tipo).find((r) => r.id === recursoId);
  if (!recurso) {
    throw rechazo('Ese recurso no existe', 404);
  }
  if (!FRANJAS.includes(hora)) {
    throw rechazo('Esa hora no está disponible para reservar');
  }

  let horas = 1;
  let regla = null;
  const documento = String(identificacion || '').trim();
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
    ...(regla ? { modalidad, modalidadNombre: regla.nombre, identificacion: documento } : {}),
    solicitante,
    estado: 'reservado',
    creadoEn: new Date().toISOString(),
  };
  reservas.push(reserva);
  return reserva;
}

function listarReservas({ tipo } = {}) {
  return reservas
    .filter((r) => !tipo || r.tipo === tipo)
    .slice()
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

const SIGUIENTE_ESTADO = { reservado: 'en_uso', en_uso: 'finalizado' };

function avanzarEstado(id) {
  const reserva = reservas.find((r) => r.id === id);
  if (!reserva) return null;
  const siguiente = SIGUIENTE_ESTADO[reserva.estado];
  if (!siguiente) return reserva;
  reserva.estado = siguiente;
  return reserva;
}

function cancelarReserva(id) {
  const reserva = reservas.find((r) => r.id === id);
  if (!reserva) return null;
  reserva.estado = 'cancelado';
  return reserva;
}

function resumen() {
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    total: reservas.length,
    hoy: reservas.filter((r) => r.fecha === hoy).length,
    activas: reservas.filter((r) => ['reservado', 'en_uso'].includes(r.estado)).length,
  };
}

module.exports = { recursosDe, disponibilidad, crearReserva, listarReservas, avanzarEstado, cancelarReserva, resumen };
