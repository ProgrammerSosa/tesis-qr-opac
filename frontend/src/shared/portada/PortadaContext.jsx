import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { portadaApi } from '../api/portadaApi';

// Lo que casi todas las páginas necesitan saber: los horarios de la semana, si la biblioteca atiende en este momento y los
// avisos vigentes. Se pide una sola vez al abrir el sitio y se renueva cada minuto (y al volver a la pestaña), para que
// "Abierto ahora" no quede desactualizado en un kiosco que pasa horas encendido.
const MS_ENTRE_ACTUALIZACIONES = 60 * 1000;

const PortadaContext = createContext({ portada: null, cargando: true, error: false, recargar: () => {} });

export function PortadaProvider({ children }) {
  const [portada, setPortada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const res = await portadaApi.portada();
      setPortada(res.data.data);
      setError(false);
    } catch {
      // Es información de apoyo: si no llega, el sitio sigue funcionando sin ella.
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
    const reloj = setInterval(recargar, MS_ENTRE_ACTUALIZACIONES);
    const alVolver = () => {
      if (document.visibilityState === 'visible') recargar();
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(reloj);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [recargar]);

  const valor = useMemo(() => ({ portada, cargando, error, recargar }), [portada, cargando, error, recargar]);
  return <PortadaContext.Provider value={valor}>{children}</PortadaContext.Provider>;
}

export function usePortada() {
  return useContext(PortadaContext);
}
