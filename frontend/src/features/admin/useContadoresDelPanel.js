import { useEffect, useState } from 'react';
import { adminApi } from './adminApi';
import { puedeVer } from './secciones';

const CADA_CUANTO_MS = 30 * 1000;

// Lo que está esperando atención, para los avisos del menú lateral (los números junto a «Reservas», «Solvencias» y «Códigos QR»).
// Se pide al abrir el panel, cada 30 segundos mientras la pestaña está a la vista, al volver a ella y al cambiar de sección
// (para que, después de atender algo, el número baje enseguida). Solo se piden las cifras que el rol puede ver.
// Devuelve { reservas, solicitudes, qr }: la clave de cada sección con su número (vacío mientras no hay datos).
export function useContadoresDelPanel(rol, ruta) {
  const [contadores, setContadores] = useState({});

  useEffect(() => {
    if (!['reservas', 'solicitudes', 'qr'].some((seccion) => puedeVer(rol, seccion))) return undefined;
    let vigente = true;

    async function cargar() {
      if (document.hidden) return;
      try {
        const { data } = await adminApi.resumen();
        if (!vigente) return;
        const cifras = data.data;
        setContadores({
          ...(puedeVer(rol, 'reservas') ? { reservas: cifras.reservas.porAtenderHoy } : {}),
          ...(puedeVer(rol, 'solicitudes') ? { solicitudes: cifras.solvencia.pendientes } : {}),
          ...(puedeVer(rol, 'qr') ? { qr: cifras.tesis.qrPorRevisar } : {}),
        });
      } catch {
        // si una consulta falla, el menú se queda con los números anteriores
      }
    }

    cargar();
    const intervalo = setInterval(cargar, CADA_CUANTO_MS);
    document.addEventListener('visibilitychange', cargar);
    return () => {
      vigente = false;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', cargar);
    };
  }, [rol, ruta]);

  return contadores;
}
