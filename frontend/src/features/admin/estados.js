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

// Roles del personal, con lo que puede hacer cada uno (propuesta, sección 4.5.6).
export const ROLES_DEL_PERSONAL = {
  administrador: { nombre: 'Administrador', descripcion: 'Gestión completa y configuración general' },
  circulacion: { nombre: 'Personal de circulación', descripcion: 'Reservas, solicitudes y usuarios' },
  tesis: { nombre: 'Personal de tesis', descripcion: 'Documentos digitales y códigos QR' },
  consulta: { nombre: 'Consulta', descripcion: 'Solo estadísticas' },
};

// Cómo se lee cada acción de la bitácora de actividad (el servidor guarda códigos como "reserva.cancelada").
export const ACCIONES_DE_ACTIVIDAD = {
  'acceso.iniciado': 'Inició sesión',
  'acceso.cerrado': 'Cerró sesión',
  'reserva.avanzada': 'Cambió el estado de una reserva',
  'reserva.cancelada': 'Canceló una reserva',
  'reserva.liberada': 'Liberó un lugar reservado',
  'solicitud.avanzada': 'Avanzó una solicitud de solvencia',
  'solicitud.rechazada': 'Rechazó una solicitud de solvencia',
  'tesis.documento': 'Cambió el documento digital de una tesis',
  'qr.estado': 'Cambió el estado de un código QR',
  'qr.verificado': 'Verificó un código QR',
  'personal.creada': 'Creó una cuenta del personal',
  'personal.actualizada': 'Modificó una cuenta del personal',
  'personal.clave': 'Restableció la clave de una cuenta',
  'cuenta.clave': 'Cambió su propia clave',
  'configuracion.cambiada': 'Cambió la configuración',
};

export const CATEGORIAS_DE_ACTIVIDAD = {
  acceso: 'Acceso',
  reserva: 'Reservas',
  solicitud: 'Solicitudes',
  tesis: 'Tesis digitales',
  qr: 'Códigos QR',
  personal: 'Cuentas del personal',
  cuenta: 'Cuenta propia',
  configuracion: 'Configuración',
};

// Fecha y hora legibles para una marca de tiempo ISO.
export function fechaLegible(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' });
}
