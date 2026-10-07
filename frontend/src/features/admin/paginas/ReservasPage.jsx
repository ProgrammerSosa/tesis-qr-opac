import { useCallback, useEffect, useMemo, useState } from 'react';
import { DoorOpen, Loader2, RefreshCw, Stamp, X } from 'lucide-react';
import { reservasApi } from '../../reservas/reservasApi';
import { usePaginaLocal } from '../usePaginaLocal';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Paginacion from '../../../shared/components/Paginacion';
import { hoyISO } from '../../../shared/utils/fechas';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ESTADO_RESERVA, MOTIVO_LIBERACION, SIGUIENTE_RESERVA, TIPO_RESERVA } from '../estados';

// Reservas de cubículos y espacios. "Liberar" devuelve el lugar a la disponibilidad cuando la persona no llegó;
// el sistema también lo hace solo pasado el tiempo de tolerancia (propuesta, sección 4.5.2).
export default function ReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [cuando, setCuando] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await reservasApi.listar();
      setReservas(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las reservas'));
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

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const hoy = hoyISO();
    return reservas.filter(
      (r) =>
        (!estado || r.estado === estado) &&
        (!tipo || r.tipo === tipo) &&
        (!cuando || (cuando === 'hoy' ? r.fecha === hoy : cuando === 'proximas' ? r.fecha >= hoy : r.fecha < hoy)) &&
        (!texto ||
          [r.id, r.codigoConfirmacion, r.solicitante, r.identificacion, r.recursoNombre].some((v) =>
            String(v ?? '').toLowerCase().includes(texto)
          ))
    );
  }, [reservas, busqueda, estado, tipo, cuando]);
  const pagina = usePaginaLocal(filtradas, 40, [busqueda, estado, tipo, cuando]);
  const visibles = pagina.visibles;

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando reservas...
      </div>
    );
  }

  return (
    <PaginaAdmin
      descripcion="Reservas de cubículos, estaciones y sala de lectura. Si alguien no se presenta dentro del tiempo de tolerancia, el lugar se libera solo; también puedes liberarlo a mano."
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
        placeholder="Número, código, nombre o carné"
        filtros={[
          { etiqueta: 'Todos los estados', valor: estado, onCambio: setEstado, opciones: Object.entries(ESTADO_RESERVA).map(([clave, e]) => [clave, e.label]) },
          { etiqueta: 'Todos los tipos', valor: tipo, onCambio: setTipo, opciones: Object.entries(TIPO_RESERVA) },
          {
            etiqueta: 'Todas las fechas',
            valor: cuando,
            onCambio: setCuando,
            opciones: [
              ['hoy', 'De hoy'],
              ['proximas', 'De hoy en adelante'],
              ['pasadas', 'Anteriores a hoy'],
            ],
          },
        ]}
        resumen={`${filtradas.length} de ${reservas.length}`}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Código', 'Tipo', 'Recurso', 'Solicitante', 'Fecha', 'Hora', 'Origen', 'Estado', 'Acción'].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  {reservas.length === 0 ? 'Aún no hay reservas registradas.' : 'Ninguna reserva coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              visibles.map((r) => {
                const estadoDeReserva = ESTADO_RESERVA[r.estado] ?? { tone: 'neutral', label: r.estado };
                const siguiente = SIGUIENTE_RESERVA[r.estado];
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 font-mono">
                      {r.id}
                      {r.codigoConfirmacion ? <span className="block text-xs text-slate-500">{r.codigoConfirmacion}</span> : null}
                    </td>
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
                    <td className="px-3 py-2.5 text-xs text-slate-600">{r.kiosco ? `Kiosco ${r.kiosco}` : 'Web'}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={estadoDeReserva.tone}>{estadoDeReserva.label}</Badge>
                      {r.estado === 'liberada' && r.motivoLiberacion ? (
                        <span className="mt-1 block max-w-[11rem] text-xs text-slate-500">
                          {MOTIVO_LIBERACION[r.motivoLiberacion] ?? r.motivoLiberacion}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {siguiente ? (
                          <button
                            type="button"
                            onClick={() => accionar(reservasApi.avanzar, r.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <Stamp size={13} />
                            {siguiente}
                          </button>
                        ) : null}
                        {r.estado === 'reservado' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => accionar(reservasApi.liberar, r.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:underline"
                            >
                              <DoorOpen size={13} />
                              Liberar espacio
                            </button>
                            <button
                              type="button"
                              onClick={() => accionar(reservasApi.cancelar, r.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                            >
                              <X size={13} />
                              Cancelar
                            </button>
                          </>
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
    </PaginaAdmin>
  );
}
