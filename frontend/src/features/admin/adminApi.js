import axiosClient from '../../shared/api/axiosClient';

export const adminApi = {
  resumen: () => axiosClient.get('/admin/resumen'),
  usuarios: (q) => axiosClient.get('/admin/usuarios', { params: q ? { q } : {} }),
  tesis: () => axiosClient.get('/admin/tesis'),
  actualizarDocumento: (id, datos) => axiosClient.patch(`/admin/tesis/${id}/documento`, datos),
  codigosQr: () => axiosClient.get('/admin/qr'),
  actualizarQr: (id, activo) => axiosClient.patch(`/admin/qr/${id}`, { activo }),
  verificarQr: (id) => axiosClient.post(`/admin/qr/${id}/verificar`),
  estadisticas: () => axiosClient.get('/admin/estadisticas'),
};
