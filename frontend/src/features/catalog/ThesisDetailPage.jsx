import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { catalogApi } from './catalogApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import ThesisQr from './ThesisQr';
import ThesisLabel from './ThesisLabel';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';

const TABS = [
  { key: 'existencias', label: 'Existencias (1)' },
  { key: 'notas', label: 'Notas de título (1)' },
  { key: 'comentarios', label: 'Comentarios (0)' },
];

const EXPORTS = ['BIBTEX', 'Dublin Core', 'MARCXML', 'RIS', 'ISBD'];

export default function ThesisDetailPage() {
  const { id } = useParams();
  const [tesis, setTesis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('existencias');
  const [enLista, setEnLista] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [reservada, setReservada] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError('');
    catalogApi
      .getById(id)
      .then((res) => setTesis(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar la tesis')))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 pt-10 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando...
      </div>
    );
  }

  if (!tesis) {
    return (
      <div className="flex flex-col gap-3 pt-10">
        <p className="text-sm text-slate-500">{error || 'No se encontró esa tesis.'}</p>
        <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft size={16} />
          Volver al buscador
        </Link>
      </div>
    );
  }

  const relacionadas = tesis.relacionadas || [];

  return (
    <div className="flex flex-col gap-4 pt-4">
      <nav className="flex flex-wrap gap-1.5 text-xs text-slate-500">
        <Link to="/catalogo" className="hover:text-primary">
          Catálogo
        </Link>
        <span>›</span>
        <Link to={`/catalogo?tema=${encodeURIComponent(tesis.temas[0])}`} className="hover:text-primary">
          Tema: {tesis.temas[0]}
        </Link>
        <span>›</span>
        <span>Ficha de la tesis</span>
      </nav>

      <article className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Tesis de grado</Badge>
          <Badge tone="status" dot>
            {tesis.estado} para consulta
          </Badge>
        </div>

        <h1 className="text-balance font-serif text-xl font-semibold leading-snug text-primary-dark sm:text-2xl">{tesis.titulo}</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {tesis.autor} · Programa de {tesis.programa}
        </p>
        <p className="mt-2.5 text-sm text-slate-500">
          Bogotá : Universidad — {tesis.facultad}, {tesis.anio}.
        </p>
        <p className="mb-4 text-sm text-slate-500">Descripción: {tesis.paginas} p.</p>

        <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-b border-border pb-4 text-sm">
          <dt className="text-slate-500">Director(a)</dt>
          <dd>{tesis.director}</dd>
          <dt className="text-slate-500">Modalidad</dt>
          <dd>{tesis.modalidad}</dd>
          <dt className="text-slate-500">Código</dt>
          <dd className="font-mono">{tesis.id}</dd>
        </dl>

        <p className="mb-1.5 text-sm font-semibold text-slate-500">Tema(s):</p>
        <ul className="mb-4 flex flex-col gap-1">
          {tesis.temas.map((tema) => (
            <li key={tema} className="text-sm text-slate-500">
              <span className="text-slate-400">— </span>
              <Link to={`/catalogo?tema=${encodeURIComponent(tema)}`} className="text-primary hover:underline">
                {tema}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mb-4 border-l-2 border-border pl-3 text-sm leading-relaxed text-slate-500">
          <b className="font-semibold text-slate-700">Resumen — </b>
          {tesis.resumen}
        </p>

        <div className="flex gap-4 overflow-x-auto border-b border-border text-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px whitespace-nowrap border-b-2 pb-2.5 font-medium transition-colors ${
                tab === t.key ? 'border-accent text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {tab === 'existencias' ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-surface uppercase tracking-wide text-slate-500">
                  <tr>
                    {['Tipo de ítem', 'Biblioteca actual', 'Colección', 'Signatura topográfica', 'Copia número', 'Estado', 'Código de barras'].map(
                      (h) => (
                        <th key={h} className="whitespace-nowrap px-2.5 py-2 font-semibold">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-2.5 py-2.5">Tesis impresa + QR</td>
                    <td className="px-2.5 py-2.5">{tesis.ubicacion}</td>
                    <td className="px-2.5 py-2.5">{tesis.coleccion}</td>
                    <td className="px-2.5 py-2.5 font-mono">{tesis.signatura}</td>
                    <td className="px-2.5 py-2.5">1</td>
                    <td className="px-2.5 py-2.5">
                      <Badge tone="status" dot>
                        {tesis.estado}
                      </Badge>
                    </td>
                    <td className="px-2.5 py-2.5 font-mono">{tesis.id}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'notas' ? (
            <p className="text-sm text-slate-500">
              Tipo documental: tesis de grado. Idioma: español. Formato digital disponible: PDF (acceso institucional, bajo
              solicitud).
            </p>
          ) : null}

          {tab === 'comentarios' ? (
            <p className="text-sm text-slate-500">
              No hay comentarios en este título.{' '}
              <Link to="#" className="text-primary hover:underline">
                Iniciar sesión
              </Link>{' '}
              para dejar un comentario.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button variant="primary" className="w-full" disabled={reservada} onClick={() => setReservada(true)}>
            {reservada ? 'Solicitud registrada' : 'Hacer reserva'}
          </Button>
          <Button variant={enLista ? 'toggled' : 'secondary'} className="w-full" onClick={() => setEnLista((v) => !v)}>
            {enLista ? 'En lista de consulta ✓' : 'Agregar a lista de consulta'}
          </Button>
          <Button variant={guardado ? 'toggled' : 'secondary'} className="w-full" onClick={() => setGuardado((v) => !v)}>
            {guardado ? 'Registro guardado' : 'Guardar registro'}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {EXPORTS.map((f) => (
            <span key={f} className="rounded-md border border-dashed border-border px-2 py-1 font-mono text-[11px] text-slate-500">
              {f}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-sm">
          <span className="text-slate-500">Buscar este título en:</span>
          <a
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://search.worldcat.org/search?q=${encodeURIComponent(tesis.titulo)}`}
          >
            Otras bibliotecas (WorldCat)
          </a>
          <a
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(tesis.titulo)}`}
          >
            Google Scholar
          </a>
        </div>

        <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
          <ThesisQr id={tesis.id} />
          <div>
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-accent">Versión móvil QR</p>
            <p className="text-sm text-slate-500">
              Escanea para llevar este registro a tu dispositivo. Es el mismo código dinámico impreso en la etiqueta de la
              contraportada: no es necesario pedir el ejemplar físico para consultarlo.
            </p>
          </div>
        </div>
      </article>

      {relacionadas.length > 0 ? (
        <>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-accent">También te puede interesar</p>
          <div className="flex flex-col gap-2">
            {relacionadas.map((rel) => (
              <Link
                key={rel.id}
                to={`/tesis/${rel.id}`}
                className="rounded-lg border border-border bg-white p-3.5 transition-colors hover:border-accent"
              >
                <p className="text-sm font-medium text-slate-800">{rel.titulo}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {rel.autor} · {rel.anio} · {rel.temas[0]}
                </p>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-accent">Propuesta de etiqueta para contraportada</p>
      <ThesisLabel tesis={tesis} />

      <p className="mt-2 text-center text-[11.5px] text-slate-400">
        Anexo 1 — Propuesta de etiqueta QR y ficha en el catálogo (OPAC) para tesis de grado.
      </p>
    </div>
  );
}
