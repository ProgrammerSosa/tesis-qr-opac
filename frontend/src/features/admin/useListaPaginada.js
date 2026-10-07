import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../../shared/api/axiosClient';

// Lista del panel que viene del servidor por páginas, con búsqueda por texto (con una pequeña espera mientras se escribe)
// y un filtro por documento. `pedir(params)` es la función de la API; debe ser siempre la misma función.
export function useListaPaginada(pedir, { porPagina = 25 } = {}) {
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [documento, setDocumento] = useState('');
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const peticion = useRef(0);

  useEffect(() => {
    const espera = setTimeout(() => {
      setConsulta(texto.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(espera);
  }, [texto]);

  const cargar = useCallback(async () => {
    const numero = ++peticion.current;
    setCargando(true);
    try {
      const res = await pedir({ q: consulta || undefined, documento: documento || undefined, pagina, porPagina });
      if (numero !== peticion.current) return; // llegó una respuesta más nueva: esta ya no sirve
      setDatos(res.data.data);
      setError('');
    } catch (err) {
      if (numero !== peticion.current) return;
      setError(getErrorMessage(err, 'No se pudo cargar la lista'));
    } finally {
      if (numero === peticion.current) setCargando(false);
    }
  }, [pedir, consulta, documento, pagina, porPagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarDocumento = useCallback((valor) => {
    setDocumento(valor);
    setPagina(1);
  }, []);

  // Cambia un registro de la página sin volver a pedirla (por ejemplo, después de guardar una fila).
  const reemplazar = useCallback((actualizado) => {
    setDatos((previo) => (previo ? { ...previo, items: previo.items.map((t) => (t.id === actualizado.id ? actualizado : t)) } : previo));
  }, []);

  return {
    items: datos?.items ?? [],
    total: datos?.total ?? 0,
    paginas: datos?.paginas ?? 1,
    pagina: datos?.pagina ?? pagina,
    cargando,
    primeraCarga: datos === null,
    error,
    setError,
    texto,
    setTexto,
    documento,
    cambiarDocumento,
    irAPagina: setPagina,
    recargar: cargar,
    reemplazar,
  };
}
