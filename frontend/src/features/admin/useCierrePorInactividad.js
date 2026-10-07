import { useEffect, useRef, useState } from 'react';

// Cierra la sesión si nadie toca la pantalla durante `minutos`. Durante los últimos `avisoSegundos` devuelve los
// segundos que quedan (para avisar); mientras tanto devuelve null. Se mide con la hora, no contando vueltas del reloj,
// porque un navegador con la pestaña en segundo plano frena los temporizadores.
export function useCierrePorInactividad({ activo, minutos, avisoSegundos, alCerrar }) {
  const [restante, setRestante] = useState(null);
  const ultimaActividad = useRef(Date.now());
  const alCerrarActual = useRef(alCerrar);

  useEffect(() => {
    alCerrarActual.current = alCerrar;
  });

  useEffect(() => {
    if (!activo) return undefined;

    ultimaActividad.current = Date.now();
    const alInteractuar = () => {
      ultimaActividad.current = Date.now();
      setRestante(null);
    };
    const eventos = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    eventos.forEach((evento) => window.addEventListener(evento, alInteractuar, { passive: true }));

    const limite = minutos * 60;
    const reloj = setInterval(() => {
      const inactivo = (Date.now() - ultimaActividad.current) / 1000;
      if (inactivo >= limite) {
        clearInterval(reloj);
        setRestante(null);
        alCerrarActual.current();
      } else if (inactivo >= limite - avisoSegundos) {
        setRestante(Math.ceil(limite - inactivo));
      }
    }, 1000);

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, alInteractuar));
      clearInterval(reloj);
    };
  }, [activo, minutos, avisoSegundos]);

  return restante;
}
