import axiosClient from '../../shared/api/axiosClient';

export const solvenciaApi = {
  motivos: () => axiosClient.get('/solvencia/motivos'),
  solicitar: (datos) => axiosClient.post('/solvencia', datos),
  listar: () => axiosClient.get('/solvencia'),
  avanzar: (id) => axiosClient.patch(`/solvencia/${id}/avanzar`),
  rechazar: (id) => axiosClient.patch(`/solvencia/${id}/rechazar`),
};
