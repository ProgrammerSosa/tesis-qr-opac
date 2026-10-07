import { useEffect, useState } from 'react';

// Pagina en el navegador una lista que ya se descargó completa (reservas, solicitudes...). Vuelve a la primera página
// cuando cambia alguno de los valores de `reiniciarCon` (la búsqueda o los filtros).
export function usePaginaLocal(items, tamano = 50, reiniciarCon = []) {
  const [pagina, setPagina] = useState(1);
  const paginas = Math.max(Math.ceil(items.length / tamano), 1);
  const actual = Math.min(pagina, paginas);

  useEffect(() => {
    setPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, reiniciarCon);

  return {
    visibles: items.slice((actual - 1) * tamano, actual * tamano),
    pagina: actual,
    paginas,
    irAPagina: setPagina,
  };
}
