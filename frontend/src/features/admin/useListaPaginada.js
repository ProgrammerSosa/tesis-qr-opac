import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../../shared/api/axiosClient';

// Lista del panel que viene del servidor por páginas, con búsqueda por texto (con una pequeña espera mientras se escribe)
// y filtros con nombre (`filtros.documento`, `filtros.verificacion`...; `cambiarFiltro(nombre, valor)` los cambia). `pedir(params)` es la
// función de la API; debe ser siempre la misma función. `respuesta` es la página completa que mandó el servidor.
export function useListaPaginada(pedir, { porPagina = 25 } = {}) {
  const [texto, setTexto] = useState('');
  const [consulta, setConsulta] = useState('');
  const [filtros, setFiltros] = useState({});
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
      const conValor = Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor));
      const res = await pedir({ q: consulta || undefined, ...conValor, pagina, porPagina });
      if (numero !== peticion.current) return; // llegó una respuesta más nueva: esta ya no sirve
      setDatos(res.data.data);
      setError('');
    } catch (err) {
      if (numero !== peticion.current) return;
      setError(getErrorMessage(err, 'No se pudo cargar la lista'));
    } finally {
      if (numero === peticion.current) setCargando(false);
    }
  }, [pedir, consulta, filtros, pagina, porPagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarFiltro = useCallback((nombre, valor) => {
    setFiltros((previos) => ({ ...previos, [nombre]: valor }));
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
    filtros,
    cambiarFiltro,
    hayFiltros: Object.values(filtros).some(Boolean),
    respuesta: datos,
    irAPagina: setPagina,
    recargar: cargar,
    reemplazar,
  };
}
