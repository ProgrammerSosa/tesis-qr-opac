import { useEffect } from 'react';
import { LIBRARY } from '../config/library';

// Pone el título de la pestaña del navegador: "Catálogo de tesis · Biblioteca Derecho USAC".
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${LIBRARY.tituloSitio}` : `${LIBRARY.tituloSitio} · ${LIBRARY.nombreCorto.replace('Biblioteca ', '')}`;
  }, [titulo]);
}
