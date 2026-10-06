import axiosClient from '../../shared/api/axiosClient';

export const authApi = {
  login: (usuario, clave) => axiosClient.post('/auth/login', { usuario, clave }),
  logout: () => axiosClient.post('/auth/logout'),
  me: () => axiosClient.get('/auth/me'),
};
