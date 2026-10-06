import axiosClient from './axiosClient';

export const comprobantesApi = {
  enviar: (datos) => axiosClient.post('/comprobantes/enviar', datos),
};
