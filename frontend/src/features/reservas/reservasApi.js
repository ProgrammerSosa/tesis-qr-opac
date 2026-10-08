import axiosClient from '../../shared/api/axiosClient';

export const reservasApi = {
  disponibilidad: (tipo, fecha) => axiosClient.get(`/reservas/${tipo}/disponibilidad`, { params: { fecha } }),
  // Si hay servicio un día concreto y a qué horas se puede reservar (avisa de los días de cierre).
  diaDeHorario: (fecha) => axiosClient.get('/horarios/dia', { params: { fecha } }),
  reglas: () => axiosClient.get('/reservas/reglas'),
  condiciones: () => axiosClient.get('/reservas/condiciones'),
  reservar: (tipo, datos) => axiosClient.post(`/reservas/${tipo}`, datos),
  listar: (tipo) => axiosClient.get('/reservas', { params: tipo ? { tipo } : {} }),
  avanzar: (id) => axiosClient.patch(`/reservas/item/${id}/avanzar`),
  cancelar: (id) => axiosClient.patch(`/reservas/item/${id}/cancelar`),
  liberar: (id) => axiosClient.patch(`/reservas/item/${id}/liberar`),
};
