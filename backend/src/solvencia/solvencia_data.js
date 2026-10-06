const solicitudes = [];
let contador = 0;

function siguienteCodigo() {
  contador += 1;
  return `SOL-${String(contador).padStart(3, '0')}`;
}

const MOTIVOS = ['Grado', 'Certificado de paz y salvo', 'Retiro del programa', 'Otro'];

function crear({ solicitante, identificacion, programa, motivo }) {
  const solicitud = {
    id: siguienteCodigo(),
    solicitante,
    identificacion,
    programa,
    motivo,
    estado: 'pendiente',
    creadoEn: new Date().toISOString(),
  };
  solicitudes.push(solicitud);
  return solicitud;
}

function listar() {
  return solicitudes.slice().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

const SIGUIENTE_ESTADO = { pendiente: 'en_revision', en_revision: 'aprobada' };

function avanzarEstado(id) {
  const solicitud = solicitudes.find((s) => s.id === id);
  if (!solicitud) return null;
  const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
  if (!siguiente) return solicitud;
  solicitud.estado = siguiente;
  return solicitud;
}

function rechazar(id) {
  const solicitud = solicitudes.find((s) => s.id === id);
  if (!solicitud) return null;
  solicitud.estado = 'rechazada';
  return solicitud;
}

function resumen() {
  return {
    total: solicitudes.length,
    pendientes: solicitudes.filter((s) => s.estado === 'pendiente').length,
  };
}

module.exports = { MOTIVOS, crear, listar, avanzarEstado, rechazar, resumen };
