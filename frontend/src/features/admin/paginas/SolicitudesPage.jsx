import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { solvenciaApi } from '../../solvencia/solvenciaApi';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ESTADO_SOLVENCIA, SIGUIENTE_SOLVENCIA } from '../estados';

// Solicitudes de solvencia (paz y salvo bibliotecario): el personal las pasa a revisión y las aprueba o rechaza.
export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');

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

  async function accionar(accion, id) {
    try {
      await accion(id);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar la acción'));
    }
    await cargar();
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return solicitudes.filter(
      (s) =>
        (!estado || s.estado === estado) &&
        (!texto ||
          [s.id, s.codigoConfirmacion, s.solicitante, s.identificacion, s.programa, s.motivo].some((v) =>
            String(v ?? '').toLowerCase().includes(texto)
          ))
    );
  }, [solicitudes, busqueda, estado]);

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
      descripcion="Solicitudes de solvencia que llegan desde los kioscos y la web. Pásalas a revisión y luego apruébalas o recházalas."
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
        placeholder="Radicado, nombre, carné o programa"
        filtros={[
          { etiqueta: 'Todos los estados', valor: estado, onCambio: setEstado, opciones: Object.entries(ESTADO_SOLVENCIA).map(([clave, e]) => [clave, e.label]) },
        ]}
        resumen={`${visibles.length} de ${solicitudes.length}`}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Radicado', 'Solicitante', 'Programa', 'Motivo', 'Origen', 'Estado', 'Acción'].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  {solicitudes.length === 0 ? 'Aún no hay solicitudes registradas.' : 'Ninguna solicitud coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              visibles.map((s) => {
                const estadoDeSolicitud = ESTADO_SOLVENCIA[s.estado] ?? { tone: 'neutral', label: s.estado };
                const siguiente = SIGUIENTE_SOLVENCIA[s.estado];
                return (
                  <tr key={s.id}>
                    <td className="px-3 py-2.5 font-mono">
                      {s.id}
                      {s.codigoConfirmacion ? <span className="block text-xs text-slate-500">{s.codigoConfirmacion}</span> : null}
                    </td>
                    <td className="px-3 py-2.5">
                      {s.solicitante}
                      {s.identificacion ? <span className="block font-mono text-xs text-slate-500">{s.identificacion}</span> : null}
                    </td>
                    <td className="px-3 py-2.5">{s.programa}</td>
                    <td className="px-3 py-2.5">{s.motivo}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{s.kiosco ? `Kiosco ${s.kiosco}` : 'Web'}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={estadoDeSolicitud.tone}>{estadoDeSolicitud.label}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-3">
                        {siguiente ? (
                          <button
                            type="button"
                            onClick={() => accionar(solvenciaApi.avanzar, s.id)}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {siguiente}
                          </button>
                        ) : null}
                        {['pendiente', 'en_revision'].includes(s.estado) ? (
                          <button
                            type="button"
                            onClick={() => accionar(solvenciaApi.rechazar, s.id)}
                            className="text-xs font-medium text-secondary hover:underline"
                          >
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
    </PaginaAdmin>
  );
}
