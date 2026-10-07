import axiosClient from '../../shared/api/axiosClient';

export const solvenciaApi = {
  motivos: () => axiosClient.get('/solvencia/motivos'),
  // Motivos, días máximos de anticipación y cuándo se entregaría una solicitud enviada ahora.
  reglas: () => axiosClient.get('/solvencia/reglas'),
  solicitar: (datos) => axiosClient.post('/solvencia', datos),
  listar: () => axiosClient.get('/solvencia'),
  avanzar: (id) => axiosClient.patch(`/solvencia/${id}/avanzar`),
  rechazar: (id, observacion) => axiosClient.patch(`/solvencia/${id}/rechazar`, { observacion }),
};
