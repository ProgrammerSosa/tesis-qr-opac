import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, FileText, Loader2, Lock, Smartphone } from 'lucide-react';
import { catalogApi, urlDelDocumento } from './catalogApi';
import { ACCESOS } from './tiposDocumento';
import ThesisQr, { enlaceDeDocumento } from './ThesisQr';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import Badge from '../../shared/components/Badge';
import { Breadcrumb } from '../../shared/components/PageHeader';

// Visor del documento digital de una tesis (propuesta, secciones 3.2 y 4.2). El nivel de acceso lo hace cumplir el
// servidor: aquí solo se muestran las opciones que corresponden. "Consulta" se ve en línea; "Acceso y descarga" también se baja.
export default function ThesisDocumentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { kiosco, registrarEvento } = useKiosco();
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

  const fichaUrl = `/tesis/${tesis.id}`;
  const migas = [
    { label: 'Inicio', to: '/' },
    { label: 'Catálogo', to: '/catalogo' },
    { label: tesis.titulo, to: fichaUrl },
    { label: 'Documento digital' },
  ];

  if (!tesis.documentoDigital?.disponible) {
    return (
      <div className="flex flex-col gap-5">
        <Breadcrumb items={migas} />
        <div className="flex max-w-xl flex-col gap-3 rounded-lg border border-border bg-surface p-5">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Lock size={20} />
            Sin documento digital
          </h1>
          <p className="text-sm text-slate-600">
            Esta tesis no tiene versión digital disponible. Puedes consultar el ejemplar físico en la biblioteca: {tesis.ubicacion}
            , {tesis.modalidadAcceso.toLowerCase()} ({tesis.consultaFisica.toLowerCase()}).
          </p>
          <Link to={fichaUrl} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} />
            Volver a la ficha
          </Link>
        </div>
      </div>
    );
  }

  const acceso = ACCESOS[tesis.documentoDigital.acceso];
  const puedeDescargar = tesis.documentoDigital.acceso === 'acceso_descarga';
  const direccion = urlDelDocumento(tesis.id, { kiosco });
  // Para "solo consulta" se oculta la barra del visor de PDF del navegador (que trae el botón de guardar). Es una ayuda
  // de presentación: lo que realmente impide la descarga es que el servidor rechaza ?descargar=1 en ese nivel.
  const direccionDelVisor = puedeDescargar ? direccion : `${direccion}#toolbar=0&navpanes=0`;

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb items={migas} />

      <div>
        <h1 className="text-balance text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{tesis.titulo}</h1>
        <p className="mt-1.5 text-base text-slate-500">
          {tesis.autor} · {tesis.anio} · <span className="font-mono text-sm">{tesis.id}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <iframe
              title={`Documento digital: ${tesis.titulo}`}
              src={direccionDelVisor}
              className="h-[75vh] min-h-[480px] w-full bg-white"
            />
          </div>
          <p className="text-xs text-slate-500">Si el documento no se muestra en tu dispositivo, ábrelo en una pestaña nueva.</p>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <FileText size={18} className="text-primary" />
              <Badge tone="accent">{acceso.etiqueta}</Badge>
            </div>
            <p className="text-sm text-slate-600">{acceso.detalle}</p>
            {!puedeDescargar ? (
              <p className="flex items-start gap-1.5 text-xs text-slate-500">
                <Lock size={14} className="mt-0.5 shrink-0" />
                La biblioteca no permite descargar este documento.
              </p>
            ) : null}
            <a
              href={direccion}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <ExternalLink size={16} />
              Abrir en una pestaña nueva
            </a>
            {puedeDescargar ? (
              <a
                href={urlDelDocumento(tesis.id, { kiosco, descargar: true })}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-action px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-action-dark"
              >
                <Download size={16} />
                Descargar PDF
              </a>
            ) : null}
            <Link
              to={fichaUrl}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary"
            >
              <ArrowLeft size={16} />
              Volver a la ficha
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-lg border border-t-4 border-border border-t-action bg-white p-5 text-center shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Smartphone size={20} />
              Llévalo a tu teléfono
            </h2>
            <div className="rounded-lg border border-dashed border-border p-2">
              <ThesisQr id={tesis.id} size={150} enlace={enlaceDeDocumento(tesis.id)} />
            </div>
            <p className="text-sm text-slate-500">Escanea el código con la cámara de tu teléfono para abrir este documento.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
