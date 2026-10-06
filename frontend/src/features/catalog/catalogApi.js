import axiosClient from '../../shared/api/axiosClient';

export const catalogApi = {
  buscar: (params) => axiosClient.get('/tesis', { params }),
  getById: (id) => axiosClient.get(`/tesis/${id}`),
};

// El documento digital lo sirve el backend (comprueba el nivel de acceso y cuenta cada consulta o descarga).
// El visor lo muestra dentro de la página, así que aquí solo se arma la dirección.
export function urlDelDocumento(id, { kiosco, descargar = false } = {}) {
  const params = new URLSearchParams();
  if (kiosco) params.set('kiosco', kiosco);
  if (descargar) params.set('descargar', '1');
  const consulta = params.toString();
  return `${axiosClient.defaults.baseURL}/tesis/${id}/documento${consulta ? `?${consulta}` : ''}`;
}
