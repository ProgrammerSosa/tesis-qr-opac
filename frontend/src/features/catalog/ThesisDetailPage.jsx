import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Bookmark, Download, FileText, List, Loader2, Printer, Search, ShoppingCart, Smartphone } from 'lucide-react';
import { catalogApi } from './catalogApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import ThesisQr from './ThesisQr';
import ThesisLabel from './ThesisLabel';
import ThesisCard from './ThesisCard';
import { IsbdView, MarcView } from './ThesisRecordViews';
import { FORMATOS, descargarRegistro } from './recordExport';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Dropdown, { DropdownItem } from '../../shared/components/Dropdown';
import { Breadcrumb } from '../../shared/components/PageHeader';
import SectionTitle from '../../shared/components/SectionTitle';

const TABS = [
  { key: 'existencias', label: 'Existencias (1)' },
  { key: 'notas', label: 'Notas de título (1)' },
  { key: 'comentarios', label: 'Comentarios (0)' },
];

const VISTAS = [
  { key: 'normal', label: 'Vista normal', icon: FileText },
  { key: 'marc', label: 'Vista MARC', icon: List },
  { key: 'isbd', label: 'Vista ISBD', icon: List },
];

export default function ThesisDetailPage() {
  const { id } = useParams();
  const [tesis, setTesis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('existencias');
  const [vista, setVista] = useState('normal');
  const [enLista, setEnLista] = useState(false);
  const [reservada, setReservada] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError('');
    setVista('normal');
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
    <div className="flex flex-col gap-5">
      <Breadcrumb
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Catálogo', to: '/catalogo' },
          { label: `Detalles para: ${tesis.titulo}` },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-2 border-b border-border pb-3 print:hidden">
            {VISTAS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setVista(v.key)}
                aria-pressed={vista === v.key}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  vista === v.key ? 'bg-primary text-white shadow-sm' : 'border border-border bg-white text-slate-600 hover:border-primary hover:text-primary'
                }`}
              >
                <v.icon size={16} />
                {v.label}
              </button>
            ))}
          </div>

          <div>
            <h1 className="text-balance text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{tesis.titulo}</h1>
            <p className="mt-1.5 text-base text-slate-500">
              {tesis.autor} · Programa de {tesis.programa}
            </p>
          </div>

          {vista === 'marc' ? <MarcView tesis={tesis} /> : null}
          {vista === 'isbd' ? <IsbdView tesis={tesis} /> : null}

          {vista === 'normal' ? (
            <>
              <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed text-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500">Tipo de material:</span>
                  <Badge tone="neutral">Tesis de grado</Badge>
                  <Badge tone="status" dot>
                    {tesis.estado} para consulta
                  </Badge>
                </div>
                <p>
                  <span className="text-slate-500">Bogotá :</span> Universidad — {tesis.facultad}, {tesis.anio}.
                </p>
                <p>
                  <span className="text-slate-500">Descripción:</span> {tesis.paginas} p.
                </p>
                <p>
                  <span className="text-slate-500">Director(a):</span> {tesis.director}
                </p>
                <p>
                  <span className="text-slate-500">Modalidad:</span> {tesis.modalidad}
                </p>
                <p>
                  <span className="text-slate-500">Código:</span> <span className="font-mono">{tesis.id}</span>
                </p>
                <p>
                  <span className="text-slate-500">Tema(s):</span>{' '}
                  {tesis.temas.map((tema, i) => (
                    <span key={tema}>
                      {i > 0 ? <span className="text-slate-400"> · </span> : null}
                      <Link to={`/catalogo?tema=${encodeURIComponent(tema)}`} className="text-primary hover:underline">
                        {tema}
                      </Link>
                    </span>
                  ))}
                </p>
                <p className="border-l-2 border-border pl-3 text-slate-600">
                  <b className="font-semibold text-slate-700">Resumen — </b>
                  {tesis.resumen}
                </p>
              </div>

              <div>
                <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={tab === t.key}
                      onClick={() => setTab(t.key)}
                      className={`-mb-px rounded-t-md border px-5 py-3 text-base transition-colors ${
                        tab === t.key
                          ? 'border-border border-b-white border-t-2 border-t-action bg-white font-semibold text-slate-900'
                          : 'border-transparent text-primary hover:bg-surface'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  {tab === 'existencias' ? (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-surface text-slate-600">
                          <tr>
                            {['Tipo de ítem', 'Biblioteca actual', 'Colección', 'Signatura topográfica', 'Copia número', 'Estado', 'Código de barras'].map(
                              (h) => (
                                <th key={h} className="px-3 py-3 font-semibold">
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="align-top">
                            <td className="px-3 py-3">
                              <span className="flex items-center gap-2">
                                <BookOpen size={22} className="shrink-0 text-primary" />
                                Tesis impresa + QR
                              </span>
                            </td>
                            <td className="px-3 py-3">{tesis.ubicacion}</td>
                            <td className="px-3 py-3">{tesis.coleccion}</td>
                            <td className="px-3 py-3 font-mono">{tesis.signatura}</td>
                            <td className="px-3 py-3">1</td>
                            <td className="px-3 py-3 font-semibold text-primary">{tesis.estado}</td>
                            <td className="px-3 py-3 font-mono">{tesis.id}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {tab === 'notas' ? (
                    <p className="text-sm text-slate-600">
                      Tipo documental: tesis de grado. Idioma: español. Formato digital disponible: PDF (acceso institucional,
                      bajo solicitud).
                    </p>
                  ) : null}

                  {tab === 'comentarios' ? (
                    <p className="text-sm text-slate-600">
                      No hay comentarios en este título.{' '}
                      <Link to="/admin" className="text-primary hover:underline">
                        Iniciar sesión
                      </Link>{' '}
                      para dejar un comentario.
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </article>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5 rounded-lg bg-surface p-3.5 print:hidden">
            <Button
              variant="primary"
              icon={Bookmark}
              className="w-full justify-start px-4 py-3 text-base"
              disabled={reservada}
              onClick={() => setReservada(true)}
            >
              {reservada ? 'Solicitud registrada' : 'Hacer reserva'}
            </Button>
            <Button variant="brand" icon={Printer} className="w-full justify-start px-4 py-3 text-base" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button
              variant="brand"
              icon={ShoppingCart}
              className="w-full justify-start px-4 py-3 text-base"
              onClick={() => setEnLista((v) => !v)}
            >
              {enLista ? 'En lista de consulta ✓' : 'Agregar a lista de consulta'}
            </Button>
            <Dropdown label="Guardar registro" icon={Download}>
              {FORMATOS.map((f) => (
                <DropdownItem key={f.key} onClick={() => descargarRegistro(tesis, f)}>
                  {f.label}
                </DropdownItem>
              ))}
            </Dropdown>
            <Dropdown label="Más búsquedas" icon={Search}>
              <DropdownItem to={`/catalogo?autor=${encodeURIComponent(tesis.autor)}`}>Otras tesis de este autor</DropdownItem>
              <DropdownItem href={`https://search.worldcat.org/search?q=${encodeURIComponent(tesis.titulo)}`}>
                Otras bibliotecas (WorldCat)
              </DropdownItem>
              <DropdownItem href={`https://scholar.google.com/scholar?q=${encodeURIComponent(tesis.titulo)}`}>
                Google Scholar
              </DropdownItem>
            </Dropdown>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-lg border border-t-4 border-border border-t-action bg-white p-5 text-center shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Smartphone size={22} />
              Versión móvil QR
            </h2>
            <div className="rounded-lg border border-dashed border-border p-2">
              <ThesisQr id={tesis.id} size={180} />
            </div>
            <p className="text-sm text-slate-500">
              Escanea para llevar este registro a tu dispositivo. Es el mismo código dinámico impreso en la etiqueta de la
              contraportada: no es necesario pedir el ejemplar físico para consultarlo.
            </p>
          </div>
        </aside>
      </div>

      {relacionadas.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>También te puede interesar</SectionTitle>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {relacionadas.map((rel) => (
              <ThesisCard key={rel.id} tesis={rel} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 print:hidden">
        <SectionTitle>Propuesta de etiqueta para contraportada</SectionTitle>
        <ThesisLabel tesis={tesis} />
      </section>

      <p className="text-center text-xs text-slate-400 print:hidden">
        Anexo 1 — Propuesta de etiqueta QR y ficha en el catálogo (OPAC) para tesis de grado.
      </p>
    </div>
  );
}
