import { useEffect, useState } from 'react';
import { BookMarked, CalendarCheck, Clock, FileCheck2, Loader2, Stamp, X } from 'lucide-react';
import { adminApi } from './adminApi';
import { reservasApi } from '../reservas/reservasApi';
import { solvenciaApi } from '../solvencia/solvenciaApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import StatTile from '../../shared/components/StatTile';
import Badge from '../../shared/components/Badge';
import AlertBanner from '../../shared/components/AlertBanner';
import PageHeader from '../../shared/components/PageHeader';

const ESTADO_RESERVA = {
  reservado: { tone: 'warning', label: 'Reservado' },
  en_uso: { tone: 'accent', label: 'En uso' },
  finalizado: { tone: 'status', label: 'Finalizado' },
  cancelado: { tone: 'danger', label: 'Cancelado' },
};

const TIPO_RESERVA = { cubiculo: 'Cubículo', estacion: 'Estación', sala_lectura: 'Sala de lectura' };

const SIGUIENTE_RESERVA ={ reservado: 'Sellar ingreso', en_uso: 'Sellar salida' };

const ESTADO_SOLVENCIA = {
  pendiente: { tone: 'warning', label: 'Pendiente' },
  en_revision: { tone: 'accent', label: 'En revisión' },
  aprobada: { tone: 'status', label: 'Aprobada' },
  rechazada: { tone: 'danger', label: 'Rechazada' },
};

const SIGUIENTE_SOLVENCIA = { pendiente: 'Pasar a revisión', en_revision: 'Aprobar' };

export default function AdminDashboardPage() {
  const [resumen, setResumen] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  async function cargar() {
    setError('');
    try {
      const [r1, r2, r3] = await Promise.all([adminApi.resumen(), reservasApi.listar(), solvenciaApi.listar()]);
      setResumen(r1.data.data);
      setReservas(r2.data.data);
      setSolicitudes(r3.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar el panel'));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function avanzarReserva(id) {
    await reservasApi.avanzar(id);
    cargar();
  }

  async function cancelarReserva(id) {
    await reservasApi.cancelar(id);
    cargar();
  }

  async function avanzarSolicitud(id) {
    await solvenciaApi.avanzar(id);
    cargar();
  }

  async function rechazarSolicitud(id) {
    await solvenciaApi.rechazar(id);
    cargar();
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando panel...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'Inicio', to: '/' }, { label: 'Panel administrativo' }]}
        title="Panel administrativo"
        subtitle="Lo que el circulante ve en tiempo real: reservas de cubículos y espacios, y solicitudes de solvencia por revisar."
      />

      <AlertBanner>{error}</AlertBanner>

      {resumen ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Tesis registradas" value={resumen.tesis.total} icon={BookMarked} />
          <StatTile label="Reservas activas" value={resumen.reservas.activas} icon={Clock} />
          <StatTile label="Reservas hoy" value={resumen.reservas.hoy} icon={CalendarCheck} />
          <StatTile label="Solvencias pendientes" value={resumen.solvencia.pendientes} icon={FileCheck2} />
        </div>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold text-primary-dark">Reservas de cubículos y espacios</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Código', 'Tipo', 'Recurso', 'Solicitante', 'Fecha', 'Hora', 'Estado', 'Acción'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                    Aún no hay reservas registradas.
                  </td>
                </tr>
              ) : (
                reservas.map((r) => {
                  const estado = ESTADO_RESERVA[r.estado];
                  const siguiente = SIGUIENTE_RESERVA[r.estado];
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2.5 font-mono">{r.id}</td>
                      <td className="px-3 py-2.5">
                        {TIPO_RESERVA[r.tipo] ?? r.tipo}
                        {r.modalidadNombre ? <span className="block text-xs text-slate-500">{r.modalidadNombre}</span> : null}
                      </td>
                      <td className="px-3 py-2.5">{r.recursoNombre}</td>
                      <td className="px-3 py-2.5">
                        {r.solicitante}
                        {r.identificacion ? <span className="block font-mono text-xs text-slate-500">{r.identificacion}</span> : null}
                      </td>
                      <td className="px-3 py-2.5">{r.fecha}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono">
                        {r.hora}–{r.horaFin}
                        {r.duracion > 1 ? <span className="block text-xs text-slate-500">{r.duracion} horas</span> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={estado.tone}>{estado.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-2">
                          {siguiente ? (
                            <button
                              onClick={() => avanzarReserva(r.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <Stamp size={13} />
                              {siguiente}
                            </button>
                          ) : null}
                          {r.estado === 'reservado' ? (
                            <button
                              onClick={() => cancelarReserva(r.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                            >
                              <X size={13} />
                              Cancelar
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
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold text-primary-dark">Solicitudes de solvencia</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Radicado', 'Solicitante', 'Programa', 'Motivo', 'Estado', 'Acción'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    Aún no hay solicitudes registradas.
                  </td>
                </tr>
              ) : (
                solicitudes.map((s) => {
                  const estado = ESTADO_SOLVENCIA[s.estado];
                  const siguiente = SIGUIENTE_SOLVENCIA[s.estado];
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-2.5 font-mono">{s.id}</td>
                      <td className="px-3 py-2.5">{s.solicitante}</td>
                      <td className="px-3 py-2.5">{s.programa}</td>
                      <td className="px-3 py-2.5">{s.motivo}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={estado.tone}>{estado.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-2">
                          {siguiente ? (
                            <button
                              onClick={() => avanzarSolicitud(s.id)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {siguiente}
                            </button>
                          ) : null}
                          {['pendiente', 'en_revision'].includes(s.estado) ? (
                            <button
                              onClick={() => rechazarSolicitud(s.id)}
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
      </section>
    </div>
  );
}
