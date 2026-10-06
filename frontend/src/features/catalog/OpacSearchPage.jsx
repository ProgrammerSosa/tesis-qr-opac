import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { catalogApi } from './catalogApi';
import { TIPOS_DOCUMENTO } from './tiposDocumento';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import Button from '../../shared/components/Button';
import AlertBanner from '../../shared/components/AlertBanner';
import PageHeader from '../../shared/components/PageHeader';
import { Input, Select } from '../../shared/components/FormField';
import ThesisCard from './ThesisCard';

const CAMPOS = ['autor', 'titulo', 'anio', 'tema', 'tipo', 'digital'];

// Los criterios viven en la dirección: la barra del encabezado y los enlaces de tema navegan a /catalogo?campo=valor.
// Sin criterios se muestra todo el catálogo.
function criteriosDesdeUrl(searchParams) {
  return Object.fromEntries(CAMPOS.map((c) => [c, searchParams.get(c) || '']));
}

// Los filtros de tipo y de documento digital están en la búsqueda avanzada: si llegan en la dirección, se muestra abierta.
function debeAbrirAvanzada(searchParams) {
  return searchParams.get('avanzada') === '1' || searchParams.has('tipo') || searchParams.has('digital');
}

export default function OpacSearchPage() {
  const [searchParams] = useSearchParams();
  const { registrarEvento } = useKiosco();
  const [form, setForm] = useState(() => criteriosDesdeUrl(searchParams));
  const [avanzada, setAvanzada] = useState(() => debeAbrirAvanzada(searchParams));
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  const buscar = useCallback(async (criterios) => {
    setBuscando(true);
    setError('');
    try {
      const res = await catalogApi.buscar(criterios);
      setResultados(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo buscar en el catálogo'));
    } finally {
      setBuscando(false);
    }
  }, []);

  const consulta = searchParams.toString();
  useEffect(() => {
    const criterios = criteriosDesdeUrl(searchParams);
    setForm(criterios);
    setAvanzada(debeAbrirAvanzada(searchParams));
    buscar(criterios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta, buscar]);

  function handleSubmit(e) {
    e.preventDefault();
    registrarEvento('busqueda_opac'); // cuenta una búsqueda hecha por la persona, no la carga inicial de la página
    buscar(form);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ label: 'Inicio', to: '/' }, { label: 'Catálogo de tesis' }]}
        title="Catálogo de tesis (OPAC)"
        subtitle="Catálogo de Acceso Público en Línea — busca por autor, título, año, tema o tipo de documento."
      />

      <div className="rounded-lg border border-border bg-white">
        <button
          type="button"
          aria-expanded={avanzada}
          onClick={() => setAvanzada((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold text-primary"
        >
          Búsqueda avanzada
          <ChevronDown size={18} className={`transition-transform ${avanzada ? 'rotate-180' : ''}`} />
        </button>
        {avanzada ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 border-t border-border p-4 sm:grid-cols-2">
            <Input label="Autor" value={form.autor} onChange={(e) => handleChange('autor', e.target.value)} placeholder="Apellido, nombre" />
            <Input
              label="Título"
              value={form.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Palabras del título"
            />
            <Input label="Año" value={form.anio} onChange={(e) => handleChange('anio', e.target.value)} placeholder="2024" />
            <Input label="Tema o palabra clave" value={form.tema} onChange={(e) => handleChange('tema', e.target.value)} />
            <Select label="Tipo de documento" value={form.tipo} onChange={(e) => handleChange('tipo', e.target.value)}>
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS_DOCUMENTO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.digital === '1'}
                onChange={(e) => handleChange('digital', e.target.checked ? '1' : '')}
                className="h-4 w-4 accent-primary"
              />
              Solo tesis con documento digital
            </label>
            <div className="col-span-full flex justify-end">
              <Button type="submit" variant="primary" icon={Search} disabled={buscando}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <AlertBanner>{error}</AlertBanner>

      {resultados ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-700">{resultados.length}</strong>{' '}
            {resultados.length === 1 ? 'tesis encontrada' : 'tesis encontradas'}
          </p>
          {resultados.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-slate-400">
              No se encontraron tesis con esos criterios.
            </p>
          ) : (
            resultados.map((t) => <ThesisCard key={t.id} tesis={t} />)
          )}
        </div>
      ) : null}
    </div>
  );
}
