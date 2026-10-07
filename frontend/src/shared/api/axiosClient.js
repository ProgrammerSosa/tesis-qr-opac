import axios from 'axios';
import { borrarSesion, leerSesion } from '../auth/sesion';

// La API se pide con una dirección relativa (/api): en desarrollo la reenvía el servidor de Vite y al publicar la
// entrega el mismo servidor que entrega el sitio. VITE_API_URL sirve para el caso de una API en otro dominio.
const baseURL = import.meta.env.VITE_API_URL || '/api';

// El panel del personal escucha este aviso para volver a mostrar el inicio de sesión.
export const EVENTO_SESION_EXPIRADA = 'sesion-expirada';

const axiosClient = axios.create({ baseURL });

// Si hay una sesión del personal abierta, cada petición lleva su ficha de acceso.
axiosClient.interceptors.request.use((config) => {
  const sesion = leerSesion();
  if (sesion?.token) {
    config.headers.Authorization = `Bearer ${sesion.token}`;
  }
  return config;
});

// Una ficha que el servidor ya no reconoce (venció, o el servidor se reinició) cierra la sesión del panel.
// El propio inicio de sesión queda fuera: ahí un 401 solo significa "usuario o clave incorrectos".
axiosClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esInicioDeSesion = String(error.config?.url || '').endsWith('/auth/login');
    if (error.response?.status === 401 && error.config?.headers?.Authorization && !esInicioDeSesion) {
      borrarSesion();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = 'Ocurrio un error inesperado') {
  return error?.response?.data?.error || fallback;
}

export default axiosClient;
