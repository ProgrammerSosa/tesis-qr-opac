import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, Check, Copy, Download, FileText, List, Printer, Search, Smartphone } from 'lucide-react';
import { catalogApi } from './catalogApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import { LIBRARY } from '../../shared/config/library';
import ThesisQr from './ThesisQr';
import ThesisCard from './ThesisCard';
import { ACCESOS, TIPOS_DOCUMENTO } from './tiposDocumento';
import { IsbdView, MarcView } from './ThesisRecordViews';
import { FORMATOS, descargarRegistro } from './recordExport';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Dropdown, { DropdownItem } from '../../shared/components/Dropdown';
import Nota from '../../shared/components/Nota';
import Page from '../../shared/components/Page';
import { Cargando, EstadoVacio } from '../../shared/components/Cargando';

const TABS = [
  { key: 'existencias', label: 'Existencias' },
  { key: 'notas', label: 'Notas del título' },
];

const VISTAS = [
  { key: 'normal', label: 'Vista normal', icon: FileText },
  { key: 'marc', label: 'Vista MARC', icon: List },
  { key: 'isbd', label: 'Vista ISBD', icon: List },
];

function Dato({ etiqueta, children }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 border-b border-border py-3 last:border-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-sm font-semibold text-slate-500">{etiqueta}</dt>
      <dd className="min-w-0 text-[15px] leading-relaxed text-slate-800">{children}</dd>
    </div>
  );
}

export default function ThesisDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { registrarEvento, esKiosco } = useKiosco();
  const [tesis, setTesis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('existencias');
  const [vista, setVista] = useState('normal');
  const [copiado, setCopiado] = useState(false);
  const accesoContado = useRef(null);

  const llegoPorQr = searchParams.get('origen') === 'qr';

  useEffect(() => {
    setCargando(true);
    setError('');
    setVista('normal');
    setTesis(null);
    catalogApi
      .getById(id)
      .then((res) => setTesis(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar la tesis')))
      .finally(() => setCargando(false));
  }, [id]);

  // Cuenta una vez cada llegada por el código QR de la etiqueta (solo si ese código sigue activo).
  useEffect(() => {
    if (!tesis || !llegoPorQr || !tesis.qr?.activo || accesoContado.current === tesis.id) return;
    accesoContado.current = tesis.id;
    registrarEvento('acceso_qr', { tesisId: tesis.id });
  }, [tesis, llegoPorQr, registrarEvento]);

  async function copiarEnlace() {
    const enlace = `${window.location.origin}/tesis/${tesis.id}`;
    try {
      await navigator.clipboard.writeText(enlace);
    } catch {
      const auxiliar = document.createElement('textarea');
      auxiliar.value = enlace;
      document.body.appendChild(auxiliar);
      auxiliar.select();
      document.execCommand('copy');
      auxiliar.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  if (cargando) {
    return (
      <Page crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo', to: '/catalogo' }, { etiqueta: 'Ficha de la tesis' }]} title="Cargando la ficha...">
        <Cargando texto="Cargando la ficha de la tesis..." />
      </Page>
    );
  }

  if (!tesis) {
    return (
      <Page crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo', to: '/catalogo' }, { etiqueta: 'Tesis no encontrada' }]} title="Tesis no encontrada">
        <EstadoVacio
          icono={BookOpen}
          titulo="No encontramos esa tesis"
          accion={
            <Link to="/catalogo" className="inline-flex rounded-lg bg-action px-5 py-2.5 text-sm font-bold text-white hover:bg-action-dark">
              Volver al catálogo
            </Link>
          }
        >
          {error || 'La dirección puede estar mal escrita o la ficha ya no existe.'}
        </EstadoVacio>
      </Page>
    );
  }

  const relacionadas = tesis.relacionadas || [];
  const tipoDocumento = TIPOS_DOCUMENTO[tesis.tipoDocumento] ?? tesis.modalidad;
  const acceso = ACCESOS[tesis.documentoDigital?.acceso] ?? ACCESOS.sin_acceso;
  const hayDigital = Boolean(tesis.documentoDigital?.disponible);
  const qrDesactivado = llegoPorQr && !tesis.qr?.activo;

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo', to: '/catalogo' }, { etiqueta: 'Ficha de la tesis' }]}
      title={tesis.titulo}
      subtitle={`${tesis.autor} · ${tesis.programa}`}
      tituloDocumento={tesis.titulo}
    >
      <div className="flex flex-col gap-8">
        {qrDesactivado ? (
          <Nota tono="aviso">
            El código QR que escaneaste está desactivado. Esta es la ficha de la tesis en el catálogo de la biblioteca; si tienes dudas sobre el código,
            consulta al personal.
          </Nota>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <article className="flex min-w-0 flex-col gap-6">
            <div role="tablist" aria-label="Vista de la ficha" className="flex flex-wrap gap-2 print:hidden">
              {VISTAS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={vista === v.key}
                  onClick={() => setVista(v.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    vista === v.key ? 'bg-ink text-white shadow-sm' : 'border border-border bg-white text-slate-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  <v.icon size={16} aria-hidden="true" />
                  {v.label}
                </button>
              ))}
            </div>

            {vista === 'marc' ? <MarcView tesis={tesis} /> : null}
            {vista === 'isbd' ? <IsbdView tesis={tesis} /> : null}

            {vista === 'normal' ? (
              <>
                <section className="rounded-2xl border border-border bg-white px-5 shadow-card sm:px-7" aria-label="Datos de la tesis">
                  <dl>
                    <Dato etiqueta="Tipo de material">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{tipoDocumento}</Badge>
                        <Badge tone="status" dot>
                          {tesis.estado} para consulta
                        </Badge>
                      </span>
                    </Dato>
                    <Dato etiqueta="Publicación">
                      {LIBRARY.ciudad} : {tesis.institucion}, {tesis.facultad}, {tesis.anio}.
                    </Dato>
                    {tesis.paginas ? <Dato etiqueta="Descripción">{tesis.paginas} p.</Dato> : null}
                    {tesis.director ? <Dato etiqueta="Director(a)">{tesis.director}</Dato> : null}
                    <Dato etiqueta="Código">
                      <span className="font-mono">{tesis.id}</span>
                    </Dato>
                    {tesis.temas.length > 0 ? (
                      <Dato etiqueta="Temas">
                        {tesis.temas.map((tema, i) => (
                          <span key={tema}>
                            {i > 0 ? <span className="text-slate-300"> · </span> : null}
                            <Link to={`/catalogo?tema=${encodeURIComponent(tema)}`} className="font-medium text-primary hover:underline">
                              {tema}
                            </Link>
                          </span>
                        ))}
                      </Dato>
                    ) : null}
                    {tesis.resumen ? <Dato etiqueta="Resumen">{tesis.resumen}</Dato> : null}
                  </dl>
                </section>

                <section aria-labelledby="como-consultar" className="rounded-2xl border border-border border-l-4 border-l-primary bg-surface p-5 sm:p-6">
                  <h2 id="como-consultar" className="font-display text-xl font-semibold text-slate-900">
                    ¿Cómo consultar esta tesis?
                  </h2>
                  <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Ubicación</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{tesis.ubicacion}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Modalidad</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{tesis.modalidadAcceso}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Consulta física</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{tesis.consultaFisica}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Documento digital</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{acceso.etiqueta}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {hayDigital
                      ? acceso.detalle
                      : 'Esta tesis no tiene documento digital disponible: se consulta el ejemplar impreso en la biblioteca.'}
                  </p>
                  {hayDigital ? (
                    <Link
                      to={`/tesis/${tesis.id}/documento`}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-action px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-action-dark"
                    >
                      <FileText size={17} aria-hidden="true" />
                      Consultar documento digital
                    </Link>
                  ) : null}
                </section>

                <div>
                  <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
                    {TABS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => setTab(t.key)}
                        className={`-mb-px rounded-t-lg border px-5 py-3 text-base transition-colors ${
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
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="bg-surface text-slate-600">
                            <tr>
                              {['Tipo de ítem', 'Biblioteca actual', 'Colección', 'Signatura topográfica', 'Copia', 'Estado', 'Código de barras'].map((h) => (
                                <th key={h} scope="col" className="px-3 py-3 font-semibold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="align-top">
                              <td className="px-3 py-3">
                                <span className="flex items-center gap-2">
                                  <BookOpen size={22} className="shrink-0 text-primary" aria-hidden="true" />
                                  Tesis impresa + QR
                                </span>
                              </td>
                              <td className="px-3 py-3">{tesis.ubicacion}</td>
                              <td className="px-3 py-3">{tesis.coleccion}</td>
                              <td className="px-3 py-3 font-mono">{tesis.signatura || '—'}</td>
                              <td className="px-3 py-3">1</td>
                              <td className="px-3 py-3 font-semibold text-primary">{tesis.estado}</td>
                              <td className="px-3 py-3 font-mono">{tesis.id}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : null}

                    {tab === 'notas' ? (
                      <p className="text-sm leading-relaxed text-slate-600">
                        Tipo documental: {tipoDocumento.toLowerCase()}. Idioma: español. Versión digital:{' '}
                        {hayDigital ? `${acceso.etiqueta.toLowerCase()} (PDF).` : 'no disponible.'}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </article>

          <aside className="flex flex-col gap-5 print:hidden">
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white p-4 shadow-card">
              {hayDigital ? (
                <Link
                  to={`/tesis/${tesis.id}/documento`}
                  className="inline-flex w-full items-center justify-start gap-2 rounded-lg bg-action px-4 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-action-dark"
                >
                  <FileText size={18} aria-hidden="true" />
                  Consultar documento digital
                </Link>
              ) : null}
              {/* En un kiosco no se imprime la página ni se guardan archivos en el equipo: para llevarse la tesis se usa el código QR. */}
              {!esKiosco ? (
                <>
                  <Button variant="brand" icon={Printer} className="w-full justify-start px-4 py-3 text-base" onClick={() => window.print()}>
                    Imprimir
                  </Button>
                  <Button variant="secondary" icon={copiado ? Check : Copy} className="w-full justify-start px-4 py-3 text-base" onClick={copiarEnlace}>
                    {copiado ? 'Enlace copiado' : 'Copiar enlace de la ficha'}
                  </Button>
                  <Dropdown label="Guardar registro" icon={Download}>
                    {FORMATOS.map((f) => (
                      <DropdownItem key={f.key} onClick={() => descargarRegistro(tesis, f)}>
                        {f.label}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                </>
              ) : null}
              <Link
                to={`/catalogo?autor=${encodeURIComponent(tesis.autor)}`}
                className="inline-flex w-full items-center justify-start gap-2 rounded-lg border border-border bg-white px-4 py-3 text-base font-semibold text-primary transition-colors hover:border-primary"
              >
                <Search size={18} aria-hidden="true" />
                Otras tesis de este autor
              </Link>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-2xl border border-t-4 border-border border-t-action bg-white p-5 text-center shadow-card">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
                <Smartphone size={22} aria-hidden="true" />
                Versión móvil QR
              </h2>
              <div className="rounded-xl border border-dashed border-border p-2">
                <ThesisQr id={tesis.id} size={180} enlace={tesis.qr?.enlace || undefined} />
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                {tesis.qr?.enlace
                  ? 'Escanea para abrir el documento de esta tesis en tu dispositivo. Así no es necesario pedir el ejemplar físico para consultarlo.'
                  : 'Escanea para llevar este registro a tu dispositivo. Así no es necesario pedir el ejemplar físico para consultarlo.'}
              </p>
            </div>
          </aside>
        </div>

        {relacionadas.length > 0 ? (
          <section className="flex flex-col gap-5 print:hidden" aria-labelledby="relacionadas-titulo">
            <h2 id="relacionadas-titulo" className="font-display text-2xl font-semibold text-slate-900">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {relacionadas.map((rel) => (
                <ThesisCard key={rel.id} tesis={rel} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Page>
  );
}
