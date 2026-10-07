import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { solvenciaApi } from '../../solvencia/solvenciaApi';
import { usePaginaLocal } from '../usePaginaLocal';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import Paginacion from '../../../shared/components/Paginacion';
import { Textarea } from '../../../shared/components/FormField';
import { fechaCorta } from '../../../shared/utils/fechas';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ESTADO_SOLVENCIA, SIGUIENTE_SOLVENCIA, fechaLegible } from '../estados';

const ENCABEZADOS = ['Solicitud', 'Solicitante', 'Trámite', 'Papelería y entrega', 'Origen', 'Estado', 'Acción'];

// Pide el motivo del rechazo: la persona lo recibe por correo y, si fue un error de datos, sabe que debe enviar otra solicitud.
function ModalDeRechazo({ solicitud, onCerrar, onHecho }) {
  const [motivo, setMotivo] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');

  async function rechazar(e) {
    e.preventDefault();
    setTrabajando(true);
    setError('');
    try {
      await solvenciaApi.rechazar(solicitud.id, motivo.trim());
      onHecho();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo rechazar la solicitud'));
      setTrabajando(false);
    }
  }

  return (
    <Modal
      open
      title={`Rechazar la solicitud ${solicitud.id}`}
      onClose={trabajando ? undefined : onCerrar}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar} disabled={trabajando}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="form-rechazo" disabled={trabajando || motivo.trim().length < 3}>
            {trabajando ? 'Rechazando...' : 'Rechazar solicitud'}
          </Button>
        </>
      }
    >
      <form id="form-rechazo" onSubmit={rechazar} className="flex flex-col gap-3">
        <p className="text-sm text-slate-700">
          Solicitud de <b>{solicitud.solicitante}</b> ({solicitud.motivo}). Se le enviará un correo con el motivo.
        </p>
        <AlertBanner>{error}</AlertBanner>
        <Textarea
          label="Motivo del rechazo"
          required
          autoFocus
          rows={4}
          maxLength={500}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          hint="Por ejemplo: «El número de orden de pago no coincide con la boleta de depósito». Dile qué debe corregir en la nueva solicitud."
        />
      </form>
    </Modal>
  );
}

// Solicitudes de solvencia (paz y salvo bibliotecario): el personal las pasa a revisión y las aprueba o rechaza.
export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [rechazando, setRechazando] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await solvenciaApi.listar();
      setSolicitudes(res.data.data);
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

  async function avanzar(id) {
    try {
      await solvenciaApi.avanzar(id);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar la acción'));
    }
    await cargar();
  }

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return solicitudes.filter(
      (s) =>
        (!estado || s.estado === estado) &&
        (!texto ||
          [s.id, s.codigoConfirmacion, s.solicitante, s.identificacion, s.cui, s.correo, s.ordenDePago, s.programa, s.motivo].some((v) =>
            String(v ?? '').toLowerCase().includes(texto)
          ))
    );
  }, [solicitudes, busqueda, estado]);
  const pagina = usePaginaLocal(filtradas, 40, [busqueda, estado]);

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
      descripcion="Solicitudes de solvencia que llegan desde los kioscos y el sitio. Revisa que la orden de pago coincida con la boleta; pásalas a revisión y luego apruébalas o recházalas con el motivo. La persona recibe un correo en cada paso."
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
        placeholder="Número, nombre, carné, CUI u orden de pago"
        filtros={[
          { etiqueta: 'Todos los estados', valor: estado, onCambio: setEstado, opciones: Object.entries(ESTADO_SOLVENCIA).map(([clave, e]) => [clave, e.label]) },
        ]}
        resumen={`${filtradas.length} de ${solicitudes.length}`}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
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
            {pagina.visibles.length === 0 ? (
              <tr>
                <td colSpan={ENCABEZADOS.length} className="px-3 py-8 text-center text-slate-400">
                  {solicitudes.length === 0 ? 'Aún no hay solicitudes registradas.' : 'Ninguna solicitud coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              pagina.visibles.map((s) => {
                const estadoDeSolicitud = ESTADO_SOLVENCIA[s.estado] ?? { tone: 'neutral', label: s.estado };
                const siguiente = SIGUIENTE_SOLVENCIA[s.estado];
                return (
                  <tr key={s.id} className="align-top">
                    <td className="px-3 py-3">
                      <span className="font-mono">{s.id}</span>
                      {s.codigoConfirmacion ? <span className="block font-mono text-xs text-slate-500">{s.codigoConfirmacion}</span> : null}
                      <span className="block text-xs text-slate-400">{fechaLegible(s.creadoEn)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-slate-900">{s.solicitante}</span>
                      <span className="block font-mono text-xs text-slate-500">Carné {s.identificacion}</span>
                      {s.cui ? <span className="block font-mono text-xs text-slate-500">CUI {s.cui}</span> : null}
                      {s.correo ? <span className="block text-xs text-slate-500">{s.correo}</span> : null}
                    </td>
                    <td className="px-3 py-3">
                      {s.motivo}
                      <span className="block max-w-[14rem] text-xs text-slate-500">{s.programa}</span>
                      {s.ordenDePago ? <span className="block font-mono text-xs text-slate-500">Orden de pago {s.ordenDePago}</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs">
                      {s.fechaPapeleria ? (
                        <span className="block text-slate-700">
                          Papelería: <b>{fechaCorta(s.fechaPapeleria)}</b>
                        </span>
                      ) : null}
                      {s.entregaEstimada ? (
                        <span className="block text-slate-700">
                          Entrega: <b>{fechaCorta(s.entregaEstimada.fecha)}</b> {s.entregaEstimada.hora}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{s.kiosco ? `Kiosco ${s.kiosco}` : 'Web'}</td>
                    <td className="px-3 py-3">
                      <Badge tone={estadoDeSolicitud.tone}>{estadoDeSolicitud.label}</Badge>
                      {s.estado === 'rechazada' && s.observacion ? <span className="mt-1 block max-w-[13rem] text-xs text-slate-500">{s.observacion}</span> : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {siguiente ? (
                          <button type="button" onClick={() => avanzar(s.id)} className="text-xs font-semibold text-primary hover:underline">
                            {siguiente}
                          </button>
                        ) : null}
                        {['pendiente', 'en_revision'].includes(s.estado) ? (
                          <button type="button" onClick={() => setRechazando(s)} className="text-xs font-semibold text-secondary hover:underline">
                            Rechazar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={pagina.pagina} paginas={pagina.paginas} onCambiar={pagina.irAPagina} />

      {rechazando ? (
        <ModalDeRechazo
          solicitud={rechazando}
          onCerrar={() => setRechazando(null)}
          onHecho={() => {
            setRechazando(null);
            cargar();
          }}
        />
      ) : null}
    </PaginaAdmin>
  );
}
