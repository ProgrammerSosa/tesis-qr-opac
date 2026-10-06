const { RECURSOS, FRANJAS } = require('./recursos_data');

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

function disponibilidad(tipo, fecha) {
  return recursosDe(tipo).map((recurso) => {
    const ocupadas = reservas
      .filter((r) => r.tipo === tipo && r.recursoId === recurso.id && r.fecha === fecha && r.estado !== 'cancelado')
      .map((r) => r.hora);
    return {
      ...recurso,
      franjas: FRANJAS.map((hora) => ({ hora, disponible: !ocupadas.includes(hora) })),
    };
  });
}

function crearReserva({ tipo, recursoId, fecha, hora, solicitante }) {
  const recurso = recursosDe(tipo).find((r) => r.id === recursoId);
  if (!recurso) {
    throw new Error('Ese recurso no existe');
  }
  const ocupado = reservas.some(
    (r) => r.tipo === tipo && r.recursoId === recursoId && r.fecha === fecha && r.hora === hora && r.estado !== 'cancelado'
  );
  if (ocupado) {
    throw new Error('Ese horario ya fue reservado, elige otro');
  }

  const reserva = {
    id: `R-${siguienteCodigo()}`,
    tipo,
    recursoId,
    recursoNombre: recurso.nombre,
    fecha,
    hora,
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
