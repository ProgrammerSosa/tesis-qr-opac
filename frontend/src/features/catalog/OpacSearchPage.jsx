import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, FilterX, Search, SearchX, X } from 'lucide-react';
import { catalogApi } from './catalogApi';
import { TIPOS_DOCUMENTO } from './tiposDocumento';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import Page from '../../shared/components/Page';
import Paginacion from '../../shared/components/Paginacion';
import { Esqueleto, EstadoVacio } from '../../shared/components/Cargando';
import { Input, Select } from '../../shared/components/FormField';
import ThesisCard from './ThesisCard';

const CAMPOS = ['autor', 'titulo', 'anio', 'tema', 'tipo', 'digital'];
const ETIQUETAS = { autor: 'Autor', titulo: 'Título', anio: 'Año', tema: 'Tema', tipo: 'Tipo', digital: 'Con documento digital' };
const POR_PAGINA = 10;

// Los criterios viven en la dirección: la barra del inicio y los enlaces de tema navegan a /catalogo?campo=valor.
// Sin criterios se muestra todo el catálogo.
function criteriosDesdeUrl(searchParams) {
  return Object.fromEntries(CAMPOS.map((c) => [c, searchParams.get(c) || '']));
}

// El año, el tema y el filtro de documento digital están en la búsqueda avanzada: si llegan en la dirección, se muestra abierta.
// (El tipo de documento se elige con las pestañas de los resultados, así que no la abre.)
function debeAbrirAvanzada(searchParams) {
  return searchParams.get('avanzada') === '1' || ['digital', 'anio', 'tema'].some((campo) => searchParams.has(campo));
}

function textoDeCriterio(campo, valor) {
  if (campo === 'tipo') return TIPOS_DOCUMENTO[valor] ?? valor;
  if (campo === 'digital') return ETIQUETAS.digital;
  return `${ETIQUETAS[campo]}: ${valor}`;
}

export default function OpacSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { registrarEvento } = useKiosco();
  const [form, setForm] = useState(() => criteriosDesdeUrl(searchParams));
  const [avanzada, setAvanzada] = useState(() => debeAbrirAvanzada(searchParams));
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const encabezado = useRef(null);

  const pagina = Math.max(Number(searchParams.get('pagina')) || 1, 1);
  const consulta = searchParams.toString();
  const criterios = criteriosDesdeUrl(searchParams);
  const activos = CAMPOS.filter((c) => criterios[c]);

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  const buscar = useCallback(async (parametros, numeroDePagina) => {
    setBuscando(true);
    setError('');
    try {
      const res = await catalogApi.buscar({ ...parametros, pagina: numeroDePagina, porPagina: POR_PAGINA });
      setResultados(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo buscar en el catálogo'));
    } finally {
      setBuscando(false);
    }
  }, []);

  // Cada vez que cambia la dirección (nuevos criterios o nueva página) se vuelve a buscar.
  useEffect(() => {
    const desdeUrl = criteriosDesdeUrl(searchParams);
    setForm(desdeUrl);
    setAvanzada(debeAbrirAvanzada(searchParams));
    buscar(desdeUrl, pagina);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta, buscar]);

  // Arma la dirección con los criterios indicados; lo vacío no se escribe.
  function navegar(nuevos, numeroDePagina = 1, extra = {}) {
    const parametros = new URLSearchParams();
    CAMPOS.forEach((c) => {
      if (nuevos[c]) parametros.set(c, nuevos[c]);
    });
    if (extra.avanzada) parametros.set('avanzada', '1');
    if (numeroDePagina > 1) parametros.set('pagina', String(numeroDePagina));
    setSearchParams(parametros);
  }

  function handleSubmit(e) {
    e.preventDefault();
    registrarEvento('busqueda_opac'); // cuenta una búsqueda hecha por la persona, no la carga inicial de la página
    navegar(form, 1, { avanzada: true });
  }

  function quitar(campo) {
    navegar({ ...criterios, [campo]: '' }, 1, { avanzada: avanzada && searchParams.get('avanzada') === '1' });
  }

  function irAPagina(numero) {
    navegar(criterios, numero, { avanzada: searchParams.get('avanzada') === '1' });
    encabezado.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const tabs = [{ valor: '', etiqueta: 'Todos' }, ...Object.entries(TIPOS_DOCUMENTO).map(([valor, etiqueta]) => ({ valor, etiqueta }))];
  const hayResultados = resultados && resultados.items.length > 0;

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo de tesis' }]}
      title="Catálogo de tesis"
      subtitle="Busca por autor, título, año, tema o tipo de documento en las tesis de grado y posgrado de la Facultad."
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-white shadow-card">
          <form onSubmit={handleSubmit} className="campos-grandes p-4 sm:p-5" role="search">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  label="Título o palabras del título"
                  value={form.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Por ejemplo: conciliación en los procesos de familia"
                />
              </div>
              <div className="flex-1">
                <Input label="Autor" value={form.autor} onChange={(e) => handleChange('autor', e.target.value)} placeholder="Apellido, nombre" />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="primary" icon={Search} disabled={buscando} className="h-12 w-full px-7 text-base sm:w-auto">
                  {buscando ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>

            <button
              type="button"
              aria-expanded={avanzada}
              onClick={() => setAvanzada((v) => !v)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              Búsqueda avanzada
              <ChevronDown size={16} className={`transition-transform ${avanzada ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {avanzada ? (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input label="Año" value={form.anio} inputMode="numeric" maxLength={4} onChange={(e) => handleChange('anio', e.target.value.replace(/\D/g, ''))} placeholder="2024" />
                <Input label="Tema o palabra clave" value={form.tema} onChange={(e) => handleChange('tema', e.target.value)} />
                <Select label="Tipo de documento" value={form.tipo} onChange={(e) => handleChange('tipo', e.target.value)}>
                  <option value="">Todos los tipos</option>
                  {Object.entries(TIPOS_DOCUMENTO).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.digital === '1'}
                    onChange={(e) => handleChange('digital', e.target.checked ? '1' : '')}
                    className="h-5 w-5 accent-primary"
                  />
                  Solo tesis con documento digital
                </label>
              </div>
            ) : null}
          </form>
        </div>

        <div ref={encabezado} className="scroll-mt-28 flex flex-col gap-4">
          <div role="tablist" aria-label="Tipo de documento" className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const activa = (criterios.tipo || '') === t.valor;
              return (
                <button
                  key={t.valor || 'todos'}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => navegar({ ...criterios, tipo: t.valor }, 1, { avanzada: searchParams.get('avanzada') === '1' })}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activa ? 'bg-ink text-white shadow-sm' : 'border border-border bg-white text-slate-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {t.etiqueta}
                </button>
              );
            })}
          </div>

          {activos.filter((c) => c !== 'tipo').length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">Filtros:</span>
              {activos
                .filter((c) => c !== 'tipo')
                .map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => quitar(c)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-blue-100"
                    aria-label={`Quitar el filtro ${textoDeCriterio(c, criterios[c])}`}
                  >
                    {textoDeCriterio(c, criterios[c])}
                    <X size={14} aria-hidden="true" />
                  </button>
                ))}
              <button type="button" onClick={() => navegar({})} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-action">
                <FilterX size={15} aria-hidden="true" />
                Limpiar todo
              </button>
            </div>
          ) : null}

          <AlertBanner>{error}</AlertBanner>

          {resultados ? (
            <p className="text-sm text-slate-600" aria-live="polite">
              <strong className="text-slate-900">{resultados.total.toLocaleString('es-GT')}</strong> {resultados.total === 1 ? 'resultado' : 'resultados'}
              {resultados.paginas > 1 ? ` · página ${resultados.pagina} de ${resultados.paginas}` : ''}
            </p>
          ) : null}

          {buscando && !resultados ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((n) => (
                <Esqueleto key={n} className="h-32" />
              ))}
            </div>
          ) : null}

          {resultados && !hayResultados ? (
            <EstadoVacio
              icono={SearchX}
              titulo="No encontramos tesis con esos criterios"
              accion={
                <Button variant="secondary" onClick={() => navegar({})}>
                  Ver todo el catálogo
                </Button>
              }
            >
              Revisa la ortografía, prueba con menos palabras o quita algún filtro. Si buscas una tesis reciente, puede que aún no esté catalogada.
            </EstadoVacio>
          ) : null}

          {hayResultados ? (
            <div className={`flex flex-col gap-3 transition-opacity ${buscando ? 'opacity-60' : ''}`}>
              {resultados.items.map((t) => (
                <ThesisCard key={t.id} tesis={t} />
              ))}
            </div>
          ) : null}

          {resultados ? <Paginacion pagina={resultados.pagina} paginas={resultados.paginas} onCambiar={irAPagina} className="pt-4" /> : null}
        </div>
      </div>
    </Page>
  );
}
