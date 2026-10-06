import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { catalogApi } from './catalogApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import Button from '../../shared/components/Button';
import AlertBanner from '../../shared/components/AlertBanner';
import { Input } from '../../shared/components/FormField';

export default function OpacSearchPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    autor: '',
    titulo: '',
    anio: '',
    tema: searchParams.get('tema') || 'Derecho civil',
  });
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

  useEffect(() => {
    buscar(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    buscar(form);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Búsqueda en el catálogo</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-primary-dark">Catálogo de tesis (OPAC)</h1>
      </div>

      <div className="rounded-xl border border-border bg-white p-5">
        <p className="mb-4 text-sm text-slate-500">
          Catálogo de Acceso Público en Línea — busca por autor, título, año o tema / palabra clave.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Autor" value={form.autor} onChange={(e) => handleChange('autor', e.target.value)} placeholder="Apellido, nombre" />
          <Input
            label="Título"
            value={form.titulo}
            onChange={(e) => handleChange('titulo', e.target.value)}
            placeholder="Palabras del título"
          />
          <Input label="Año" value={form.anio} onChange={(e) => handleChange('anio', e.target.value)} placeholder="2024" />
          <Input label="Tema o palabra clave" value={form.tema} onChange={(e) => handleChange('tema', e.target.value)} />
          <div className="col-span-full flex justify-end">
            <Button type="submit" variant="primary" icon={Search} disabled={buscando}>
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </form>
      </div>

      <AlertBanner>{error}</AlertBanner>

      {resultados ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">{resultados.length}</strong> tesis encontradas
          </p>
          {resultados.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-slate-400">
              No se encontraron tesis con esos criterios.
            </p>
          ) : (
            resultados.map((t) => (
              <Link
                key={t.id}
                to={`/tesis/${t.id}`}
                className="rounded-lg border border-border bg-white p-3.5 transition-colors hover:border-accent"
              >
                <p className="text-sm font-medium text-slate-800">{t.titulo}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {t.autor} · {t.anio} · {t.temas.join(', ')}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
