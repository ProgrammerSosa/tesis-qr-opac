import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import { adminApi } from '../adminApi';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import Badge from '../../../shared/components/Badge';
import AlertBanner from '../../../shared/components/AlertBanner';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ESTADO_DE_TRAMITE, ESTADO_RESERVA, ESTADO_SOLVENCIA, fechaLegible } from '../estados';

const TIPO_OPERACION = { reserva: 'Reserva', solvencia: 'Solvencia', tesis_digital: 'Tesis digital', referencias: 'Referencias' };

// Cada tipo de operación tiene sus propios estados.
function estadosDe(tipo) {
  if (tipo === 'reserva') return ESTADO_RESERVA;
  if (tipo === 'solvencia') return ESTADO_SOLVENCIA;
  return ESTADO_DE_TRAMITE;
}

// Operaciones de cada persona que usa la biblioteca, agrupadas por su carné o documento (propuesta, sección 4.5.6).
// No son las cuentas del personal: esas están en "Cuentas del personal".
export default function UsuariosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [personas, setPersonas] = useState([]);
  const [abierta, setAbierta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // La lista se pide de nuevo poco después de dejar de escribir, no con cada letra.
  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(async () => {
      try {
        const res = await adminApi.usuarios(busqueda.trim());
        if (!vigente) return;
        setPersonas(res.data.data);
        setError('');
      } catch (err) {
        if (vigente) setError(getErrorMessage(err, 'No se pudieron cargar los usuarios'));
      } finally {
        if (vigente) setCargando(false);
      }
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [busqueda]);

  return (
    <PaginaAdmin descripcion="Personas que han reservado o hecho una solicitud, con todas sus operaciones. Se agrupan por carné o documento (las solicitudes de tesis y de referencias solo cuentan si la persona dejó su carné).">
      <label className="flex max-w-md flex-col gap-1">
        <span className="text-[11px] font-semibold text-slate-500">Buscar por nombre, carné o documento</span>
        <span className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </span>
      </label>

      <AlertBanner>{error}</AlertBanner>

      {cargando ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={18} />
          Cargando usuarios...
        </div>
      ) : personas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-slate-400">
          {busqueda.trim() ? 'Ninguna persona coincide con la búsqueda.' : 'Aún no hay operaciones registradas.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {personas.map((p) => {
            const clave = p.identificacion.toLowerCase();
            const expandida = abierta === clave;
            return (
              <li key={clave} className="rounded-xl border border-border bg-white">
                <button
                  type="button"
                  aria-expanded={expandida}
                  onClick={() => setAbierta(expandida ? null : clave)}
                  className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block font-semibold text-slate-900">{p.nombre}</span>
                    <span className="block font-mono text-xs text-slate-500">{p.identificacion}</span>
                  </span>
                  <span className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      <b className="text-slate-800">{p.totalReservas}</b> {p.totalReservas === 1 ? 'reserva' : 'reservas'}
                    </span>
                    <span>
                      <b className="text-slate-800">{p.totalSolicitudes}</b> {p.totalSolicitudes === 1 ? 'solicitud' : 'solicitudes'}
                    </span>
                    <span>Última actividad: {fechaLegible(p.ultimaActividad)}</span>
                    <ChevronDown size={16} className={`transition-transform ${expandida ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {expandida ? (
                  <div className="overflow-x-auto border-t border-border">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          {['Operación', 'Número', 'Detalle', 'Estado', 'Registrada'].map((h) => (
                            <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {p.operaciones.map((o) => {
                          const estado = estadosDe(o.tipo)[o.estado] ?? { tone: 'neutral', label: o.estado };
                          return (
                            <tr key={`${o.tipo}-${o.id}`}>
                              <td className="px-3 py-2">{TIPO_OPERACION[o.tipo] ?? o.tipo}</td>
                              <td className="px-3 py-2 font-mono">{o.id}</td>
                              <td className="px-3 py-2">{o.detalle}</td>
                              <td className="px-3 py-2">
                                <Badge tone={estado.tone}>{estado.label}</Badge>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-slate-500">{fechaLegible(o.creadoEn)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </PaginaAdmin>
  );
}
