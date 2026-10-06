import axiosClient from '../../shared/api/axiosClient';

export const reservasApi = {
  disponibilidad: (tipo, fecha) => axiosClient.get(`/reservas/${tipo}/disponibilidad`, { params: { fecha } }),
  reservar: (tipo, datos) => axiosClient.post(`/reservas/${tipo}`, datos),
  listar: (tipo) => axiosClient.get('/reservas', { params: tipo ? { tipo } : {} }),
  avanzar: (id) => axiosClient.patch(`/reservas/item/${id}/avanzar`),
  cancelar: (id) => axiosClient.patch(`/reservas/item/${id}/cancelar`),
};
