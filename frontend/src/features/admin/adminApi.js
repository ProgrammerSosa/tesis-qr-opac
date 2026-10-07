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

  // Solo administrador
  personal: () => axiosClient.get('/admin/personal'),
  crearCuenta: (datos) => axiosClient.post('/admin/personal', datos),
  actualizarCuenta: (usuario, datos) => axiosClient.patch(`/admin/personal/${encodeURIComponent(usuario)}`, datos),
  restablecerClave: (usuario, clave) => axiosClient.post(`/admin/personal/${encodeURIComponent(usuario)}/clave`, { clave }),
  configuracion: () => axiosClient.get('/admin/configuracion'),
  guardarConfiguracion: (datos) => axiosClient.patch('/admin/configuracion', datos),
  actividad: (params) => axiosClient.get('/admin/actividad', { params }),
};
