import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { tramitesApi } from '../../tramites/tramitesApi';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import { Input, Textarea } from '../../../shared/components/FormField';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ACCION_DE_TRAMITE, ESTADO_DE_TRAMITE, PASOS_DE_TRAMITE, TIPO_DE_TRAMITE, fechaLegible } from '../estados';

const ENCABEZADOS = ['Solicitud', 'Solicitante', 'Detalle', 'Origen', 'Estado', 'Acción'];

// Qué pide cada cambio de estado además del propio cambio: un texto que le llega a la persona por correo.
const TEXTO_DEL_CAMBIO = {
  rechazada: { etiqueta: 'Motivo del rechazo', ayuda: 'La persona lo recibirá por correo. Explícale qué puede hacer.', minimo: 3, obligatorio: true },
  respondida: { etiqueta: 'Respuesta con la referencia', ayuda: 'Escribe la referencia completa: la persona recibirá este texto por correo.', minimo: 5, obligatorio: true },
  publicada: { etiqueta: 'Nota para la persona (opcional)', ayuda: 'Por ejemplo, el enlace donde puede consultar la tesis.', minimo: 0, obligatorio: false },
  en_proceso: null,
};

function Detalle({ t }) {
  if (t.tipo === 'tesis_digital') {
    return (
      <>
        <span className="block max-w-xs font-semibold leading-snug text-slate-900">{t.titulo}</span>
        <span className="block text-xs text-slate-500">
          {t.autor} · {t.clasificacion} · {t.nivel}, {t.anio}
        </span>
        {t.tesisId ? (
          <Link to={`/tesis/${encodeURIComponent(t.tesisId)}`} target="_blank" className="text-xs font-medium text-primary hover:underline">
            Ver la ficha en el catálogo
          </Link>
        ) : null}
      </>
    );
  }
  return (
    <>
      <span className="block max-w-xs font-semibold leading-snug text-slate-900">{t.tema}</span>
      <span className="block max-w-xs text-xs text-slate-500">Fuente: {t.fuente}</span>
    </>
  );
}

// Ventana para atender una solicitud: muestra todo lo que pidió la persona y deja elegir el siguiente estado.
function ModalDeAtencion({ tramite, onCerrar, onHecho }) {
  const pasos = PASOS_DE_TRAMITE[tramite.tipo]?.[tramite.estado] ?? [];
  const [nuevo, setNuevo] = useState(pasos[0] ?? '');
  const [observacion, setObservacion] = useState('');
  const [tesisId, setTesisId] = useState(tramite.tesisId ?? '');
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');

  const texto = TEXTO_DEL_CAMBIO[nuevo];
  const faltaTexto = texto?.obligatorio && observacion.trim().length < texto.minimo;

  async function confirmar(e) {
    e.preventDefault();
    setTrabajando(true);
    setError('');
    try {
      const cuerpo = { estado: nuevo, observacion: observacion.trim() || undefined };
      if (nuevo === 'publicada' && tesisId.trim()) cuerpo.tesisId = tesisId.trim();
      await tramitesApi.cambiarEstado(tramite.id, cuerpo);
      onHecho();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo actualizar la solicitud'));
      setTrabajando(false);
    }
  }

  const filas = [
    ['Número', tramite.id],
    ['Recibida', fechaLegible(tramite.creadoEn)],
    ['Solicitante', tramite.solicitante],
    ...(tramite.identificacion ? [['Carné o documento', tramite.identificacion]] : []),
    ['Correo', tramite.correo],
    ...(tramite.tipo === 'tesis_digital'
      ? [
          ['Tesis', tramite.titulo],
          ['Autor', tramite.autor],
          ['Clasificación', `${tramite.clasificacion} · ${tramite.nivel}, ${tramite.anio}`],
        ]
      : [
          ['Tema', tramite.tema],
          ['Fuente', tramite.fuente],
        ]),
    ...(tramite.observacion ? [['Nota anterior', tramite.observacion]] : []),
  ];

  return (
    <Modal
      open
      title={`${TIPO_DE_TRAMITE[tramite.tipo]} · ${tramite.id}`}
      onClose={trabajando ? undefined : onCerrar}
      ancho="max-w-xl"
      footer={
        pasos.length > 0 ? (
          <>
            <Button variant="secondary" onClick={onCerrar} disabled={trabajando}>
              Cancelar
            </Button>
            <Button variant={nuevo === 'rechazada' ? 'primary' : 'brand'} type="submit" form="form-tramite" disabled={trabajando || faltaTexto}>
              {trabajando ? 'Guardando...' : ACCION_DE_TRAMITE[nuevo]}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onCerrar}>
            Cerrar
          </Button>
        )
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="contents">
            <dt className="text-slate-500">{etiqueta}</dt>
            <dd className="min-w-0 break-words font-medium text-slate-900">{valor}</dd>
          </div>
        ))}
      </dl>

      {pasos.length > 0 ? (
        <form id="form-tramite" onSubmit={confirmar} className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <AlertBanner>{error}</AlertBanner>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-[11px] font-semibold text-slate-500">¿Qué quieres hacer?</legend>
            {pasos.map((paso) => (
              <label key={paso} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-blue-50">
                <input type="radio" name="paso" value={paso} checked={nuevo === paso} onChange={() => setNuevo(paso)} className="accent-primary" />
                <span className="font-semibold text-slate-900">{ACCION_DE_TRAMITE[paso]}</span>
                <Badge tone={ESTADO_DE_TRAMITE[paso].tone}>{ESTADO_DE_TRAMITE[paso].label}</Badge>
              </label>
            ))}
          </fieldset>
          {nuevo === 'publicada' && tramite.tipo === 'tesis_digital' ? (
            <Input
              label="Código de la tesis en el catálogo (opcional)"
              hint="Si la tesis ya está en el catálogo, escribe su código y el correo llevará el enlace a su ficha."
              value={tesisId}
              onChange={(e) => setTesisId(e.target.value)}
            />
          ) : null}
          {texto ? (
            <Textarea label={texto.etiqueta} required={texto.obligatorio} hint={texto.ayuda} rows={4} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
          ) : null}
          <p className="text-xs text-slate-500">La persona recibe un correo con lo que decidas aquí.</p>
        </form>
      ) : (
        <p className="mt-4 rounded-lg bg-surface px-3 py-2.5 text-sm text-slate-600">Esta solicitud ya fue atendida: no tiene más pasos.</p>
      )}
    </Modal>
  );
}

// Solicitudes de tesis en formato digital y de referencias bibliográficas que llegan por el sitio. Cada rol ve las que le
// corresponden: tesis atiende las de tesis, circulación las de referencias y el administrador ambas.
export default function TramitesPage() {
  const [tramites, setTramites] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [atendiendo, setAtendiendo] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await tramitesApi.listar();
      setTramites(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las solicitudes'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const tiposPresentes = useMemo(() => [...new Set(tramites.map((t) => t.tipo))], [tramites]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return tramites.filter(
      (t) =>
        (!tipo || t.tipo === tipo) &&
        (!estado || t.estado === estado) &&
        (!texto ||
          [t.id, t.codigoConfirmacion, t.solicitante, t.identificacion, t.correo, t.titulo, t.autor, t.clasificacion, t.tema, t.fuente].some((v) =>
            String(v ?? '').toLowerCase().includes(texto)
          ))
    );
  }, [tramites, busqueda, tipo, estado]);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando solicitudes...
      </div>
    );
  }

  return (
    <PaginaAdmin
      descripcion="Solicitudes de tesis en formato digital y de referencias bibliográficas. Atiéndelas para que la persona reciba su respuesta por correo: al publicar una tesis o responder una referencia se le avisa automáticamente."
      acciones={
        <Button variant="secondary" icon={RefreshCw} onClick={cargar}>
          Actualizar
        </Button>
      }
    >
      <AlertBanner>{error}</AlertBanner>
      <BarraDeFiltros
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Número, nombre, correo, tesis o tema"
        filtros={[
          ...(tiposPresentes.length > 1 || tipo
            ? [{ etiqueta: 'Todos los tipos', valor: tipo, onCambio: setTipo, opciones: Object.entries(TIPO_DE_TRAMITE) }]
            : []),
          { etiqueta: 'Todos los estados', valor: estado, onCambio: setEstado, opciones: Object.entries(ESTADO_DE_TRAMITE).map(([clave, e]) => [clave, e.label]) },
        ]}
        resumen={`${visibles.length} de ${tramites.length}`}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {ENCABEZADOS.map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={ENCABEZADOS.length} className="px-3 py-8 text-center text-slate-400">
                  {tramites.length === 0 ? 'Aún no hay solicitudes registradas.' : 'Ninguna solicitud coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              visibles.map((t) => {
                const e = ESTADO_DE_TRAMITE[t.estado] ?? { tone: 'neutral', label: t.estado };
                const hayPasos = Boolean(PASOS_DE_TRAMITE[t.tipo]?.[t.estado]);
                return (
                  <tr key={t.id} className="align-top">
                    <td className="px-3 py-3">
                      <span className="font-mono">{t.id}</span>
                      <span className="block text-xs text-slate-500">{TIPO_DE_TRAMITE[t.tipo]}</span>
                      <span className="block text-xs text-slate-400">{fechaLegible(t.creadoEn)}</span>
                    </td>
                    <td className="px-3 py-3">
                      {t.solicitante}
                      <span className="block text-xs text-slate-500">{t.correo}</span>
                      {t.identificacion ? <span className="block font-mono text-xs text-slate-500">{t.identificacion}</span> : null}
                    </td>
                    <td className="px-3 py-3">
                      <Detalle t={t} />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{t.kiosco ? `Kiosco ${t.kiosco}` : 'Web'}</td>
                    <td className="px-3 py-3">
                      <Badge tone={e.tone} dot>
                        {e.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setAtendiendo(t)} className="text-xs font-semibold text-primary hover:underline">
                        {hayPasos ? 'Atender' : 'Ver'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {atendiendo ? (
        <ModalDeAtencion
          key={atendiendo.id + atendiendo.estado}
          tramite={atendiendo}
          onCerrar={() => setAtendiendo(null)}
          onHecho={() => {
            setAtendiendo(null);
            cargar();
          }}
        />
      ) : null}
    </PaginaAdmin>
  );
}
