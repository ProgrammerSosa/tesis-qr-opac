import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const axiosClient = axios.create({ baseURL });

export function getErrorMessage(error, fallback = 'Ocurrio un error inesperado') {
  return error?.response?.data?.error || fallback;
}

export default axiosClient;
