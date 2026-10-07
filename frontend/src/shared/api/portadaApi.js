import axiosClient from './axiosClient';

export const portadaApi = {
  // Horarios de la semana, si la biblioteca atiende ahora, próximos cierres y avisos vigentes.
  portada: () => axiosClient.get('/portada'),
  // Si hay atención un día concreto y a qué horas se puede reservar.
  diaDeHorario: (fecha) => axiosClient.get('/horarios/dia', { params: { fecha } }),
};
