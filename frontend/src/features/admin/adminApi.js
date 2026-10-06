import axiosClient from '../../shared/api/axiosClient';

export const adminApi = {
  resumen: () => axiosClient.get('/admin/resumen'),
};
