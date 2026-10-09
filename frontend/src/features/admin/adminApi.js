import axiosClient from '../../shared/api/axiosClient';

export const adminApi = {
  resumen: () => axiosClient.get('/admin/resumen'),
  usuarios: (q) => axiosClient.get('/admin/usuarios', { params: q ? { q } : {} }),
  estadisticas: () => axiosClient.get('/admin/estadisticas'),

  // Catálogo y documentos digitales: las listas vienen por páginas ({ items, total, pagina, porPagina, paginas }).
  tesis: (params) => axiosClient.get('/admin/tesis', { params }),
  actualizarDocumento: (id, datos) => axiosClient.patch(`/admin/tesis/${id}/documento`, datos),
  codigosQr: (params) => axiosClient.get('/admin/qr', { params }),
  actualizarQr: (id, cambios) => axiosClient.patch(`/admin/qr/${id}`, cambios),
  verificarQr: (id) => axiosClient.post(`/admin/qr/${id}/verificar`),
  catalogo: (params) => axiosClient.get('/admin/catalogo', { params }),
  crearTesis: (datos) => axiosClient.post('/admin/catalogo', datos),
  actualizarTesis: (id, datos) => axiosClient.patch(`/admin/catalogo/${encodeURIComponent(id)}`, datos),
  eliminarTesis: (id) => axiosClient.delete(`/admin/catalogo/${encodeURIComponent(id)}`),
  importarCatalogo: (datos) => axiosClient.post('/admin/catalogo/importar', datos),


  // Solo administrador
  personal: () => axiosClient.get('/admin/personal'),
  crearCuenta: (datos) => axiosClient.post('/admin/personal', datos),
  actualizarCuenta: (usuario, datos) => axiosClient.patch(`/admin/personal/${encodeURIComponent(usuario)}`, datos),
  restablecerClave: (usuario, clave) => axiosClient.post(`/admin/personal/${encodeURIComponent(usuario)}/clave`, { clave }),
  configuracion: () => axiosClient.get('/admin/configuracion'),
  guardarConfiguracion: (datos) => axiosClient.patch('/admin/configuracion', datos),
  actividad: (params) => axiosClient.get('/admin/actividad', { params }),
  almacenamiento: () => axiosClient.get('/admin/almacenamiento'),
  respaldo: () => axiosClient.get('/admin/respaldo', { responseType: 'blob' }),
  correo: () => axiosClient.get('/admin/correo'),
  verificarCorreo: () => axiosClient.post('/admin/correo/verificar'),
  probarCorreo: (para) => axiosClient.post('/admin/correo/prueba', { para }),
  horarios: () => axiosClient.get('/admin/horarios'),
  guardarHorarios: (datos) => axiosClient.put('/admin/horarios', datos),
  agregarCierre: (datos) => axiosClient.post('/admin/horarios/cierres', datos),
  quitarCierre: (id) => axiosClient.delete(`/admin/horarios/cierres/${id}`),
};
