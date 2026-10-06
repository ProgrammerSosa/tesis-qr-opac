// Textos y colores de los estados que muestra el panel.
export const ESTADO_RESERVA = {
  reservado: { tone: 'warning', label: 'Reservado' },
  en_uso: { tone: 'accent', label: 'En uso' },
  finalizado: { tone: 'status', label: 'Finalizado' },
  cancelado: { tone: 'danger', label: 'Cancelado' },
  liberada: { tone: 'neutral', label: 'Liberada' },
};

export const MOTIVO_LIBERACION = {
  no_presentado: 'No se presentó dentro del tiempo de tolerancia',
  manual: 'Liberada por el personal',
};

export const TIPO_RESERVA = { cubiculo: 'Cubículo', estacion: 'Estación', sala_lectura: 'Sala de lectura' };

export const SIGUIENTE_RESERVA = { reservado: 'Sellar ingreso', en_uso: 'Sellar salida' };

export const ESTADO_SOLVENCIA = {
  pendiente: { tone: 'warning', label: 'Pendiente' },
  en_revision: { tone: 'accent', label: 'En revisión' },
  aprobada: { tone: 'status', label: 'Aprobada' },
  rechazada: { tone: 'danger', label: 'Rechazada' },
};

export const SIGUIENTE_SOLVENCIA = { pendiente: 'Pasar a revisión', en_revision: 'Aprobar' };

// Fecha y hora legibles para una marca de tiempo ISO.
export function fechaLegible(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' });
}
