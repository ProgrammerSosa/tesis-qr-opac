import axiosClient from '../../shared/api/axiosClient';

export const tramitesApi = {
  reglas: () => axiosClient.get('/tramites/reglas'),
  // tipo: 'tesis_digital' | 'referencias'
  solicitar: (tipo, datos) => axiosClient.post(`/tramites/${tipo}`, datos),
  // Solo personal autorizado.
  listar: (params) => axiosClient.get('/tramites', { params }),
  cambiarEstado: (id, datos) => axiosClient.patch(`/tramites/${id}/estado`, datos),
};
