import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, FileText, Lock, Smartphone } from 'lucide-react';
import { catalogApi, urlDelDocumento } from './catalogApi';
import { ACCESOS } from './tiposDocumento';
import ThesisQr, { enlaceDeDocumento } from './ThesisQr';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import Badge from '../../shared/components/Badge';
import Page from '../../shared/components/Page';
import { Cargando, EstadoVacio } from '../../shared/components/Cargando';

// Visor del documento digital de una tesis (propuesta, secciones 3.2 y 4.2). El nivel de acceso lo hace cumplir el
// servidor: aquí solo se muestran las opciones que corresponden. "Consulta" se ve en línea; "Acceso y descarga" también se baja.
export default function ThesisDocumentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { kiosco, esKiosco, registrarEvento } = useKiosco();
  const [tesis, setTesis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const accesoContado = useRef(null);

  useEffect(() => {
    setCargando(true);
    setError('');
    catalogApi
      .getById(id)
      .then((res) => setTesis(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar la tesis')))
      .finally(() => setCargando(false));
  }, [id]);

  // Quien llega escaneando el QR del documento también cuenta como acceso por QR.
  const llegoPorQr = searchParams.get('origen') === 'qr';
  useEffect(() => {
    if (!tesis || !llegoPorQr || !tesis.qr?.activo || accesoContado.current === tesis.id) return;
    accesoContado.current = tesis.id;
    registrarEvento('acceso_qr', { tesisId: tesis.id });
  }, [tesis, llegoPorQr, registrarEvento]);

  if (cargando) {
    return (
      <Page crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo', to: '/catalogo' }, { etiqueta: 'Documento digital' }]} title="Cargando el documento...">
        <Cargando texto="Cargando el documento..." />
      </Page>
    );
  }

  if (!tesis) {
    return (
      <Page crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Catálogo', to: '/catalogo' }, { etiqueta: 'Documento digital' }]} title="Tesis no encontrada">
        <EstadoVacio
          icono={FileText}
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

  const fichaUrl = `/tesis/${tesis.id}`;
  const migas = [
    { etiqueta: 'Inicio', to: '/' },
    { etiqueta: 'Catálogo', to: '/catalogo' },
    { etiqueta: 'Ficha de la tesis', to: fichaUrl },
    { etiqueta: 'Documento digital' },
  ];

  if (!tesis.documentoDigital?.disponible) {
    return (
      <Page crumbs={migas} title={tesis.titulo} subtitle={`${tesis.autor} · ${tesis.anio}`} tituloDocumento="Sin documento digital">
        <div className="mx-auto flex max-w-xl flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
            <Lock size={20} aria-hidden="true" />
            Sin documento digital
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Esta tesis no tiene versión digital disponible. Puedes consultar el ejemplar físico en la biblioteca: {tesis.ubicacion},{' '}
            {tesis.modalidadAcceso.toLowerCase()} ({tesis.consultaFisica.toLowerCase()}).
          </p>
          <Link to={fichaUrl} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
            <ArrowLeft size={16} aria-hidden="true" />
            Volver a la ficha
          </Link>
        </div>
      </Page>
    );
  }

  const acceso = ACCESOS[tesis.documentoDigital.acceso];
  // En un kiosco no se descarga ni se abre otra pestaña: para llevarse el documento se escanea el código QR con el teléfono.
  const puedeDescargar = tesis.documentoDigital.acceso === 'acceso_descarga' && !esKiosco;
  const direccion = urlDelDocumento(tesis.id, { kiosco });
  // Para "solo consulta" se oculta la barra del visor de PDF del navegador (que trae el botón de guardar). Es una ayuda
  // de presentación: lo que realmente impide la descarga es que el servidor rechaza ?descargar=1 en ese nivel.
  const direccionDelVisor = puedeDescargar ? direccion : `${direccion}#toolbar=0&navpanes=0`;

  return (
    <Page crumbs={migas} title={tesis.titulo} subtitle={`${tesis.autor} · ${tesis.anio} · ${tesis.id}`} tituloDocumento={`Documento: ${tesis.titulo}`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <iframe title={`Documento digital: ${tesis.titulo}`} src={direccionDelVisor} className="h-[75vh] min-h-[480px] w-full bg-white" />
          </div>
          <p className="text-xs text-slate-500">Si el documento no se muestra en tu dispositivo, ábrelo en una pestaña nueva.</p>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <FileText size={18} className="text-primary" aria-hidden="true" />
              <Badge tone="accent">{acceso.etiqueta}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{acceso.detalle}</p>
            {!puedeDescargar ? (
              <p className="flex items-start gap-1.5 text-xs text-slate-500">
                <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                {esKiosco ? 'Para llevarte el documento, escanea el código QR con tu teléfono.' : 'La biblioteca no permite descargar este documento.'}
              </p>
            ) : null}
            {!esKiosco ? (
              <a
                href={direccion}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                <ExternalLink size={16} aria-hidden="true" />
                Abrir en una pestaña nueva
              </a>
            ) : null}
            {puedeDescargar ? (
              <a
                href={urlDelDocumento(tesis.id, { kiosco, descargar: true })}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-action px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-action-dark"
              >
                <Download size={16} aria-hidden="true" />
                Descargar PDF
              </a>
            ) : null}
            <Link
              to={fichaUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm font-bold text-primary transition-colors hover:border-primary"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver a la ficha
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl border border-t-4 border-border border-t-action bg-white p-5 text-center shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
              <Smartphone size={20} aria-hidden="true" />
              Llévalo a tu teléfono
            </h2>
            <div className="rounded-xl border border-dashed border-border p-2">
              <ThesisQr id={tesis.id} size={150} enlace={enlaceDeDocumento(tesis.id)} />
            </div>
            <p className="text-sm text-slate-500">Escanea el código con la cámara de tu teléfono para abrir este documento.</p>
          </div>
        </aside>
      </div>
    </Page>
  );
}
