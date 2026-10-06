import axiosClient from '../../shared/api/axiosClient';

export const catalogApi = {
  buscar: (params) => axiosClient.get('/tesis', { params }),
  getById: (id) => axiosClient.get(`/tesis/${id}`),
};
