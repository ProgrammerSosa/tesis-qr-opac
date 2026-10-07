import { textoDeTramos } from '../utils/fechas';

// Horarios de la semana. Marca el día de hoy. Con `conReservas` agrega la columna de las horas en que se pueden reservar
// cubículos y lugares de estudio.
export default function TablaDeHorarios({ semana, conReservas = false, className = '' }) {
  if (!semana) return null;

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-white ${className}`}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Horarios de atención de la biblioteca por día de la semana</caption>
        <thead>
          <tr className="bg-surface text-xs font-bold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">
              Día
            </th>
            <th scope="col" className="px-4 py-3">
              Atención al público
            </th>
            {conReservas ? (
              <th scope="col" className="px-4 py-3">
                Reservas de lugares
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {semana.map((dia) => (
            <tr key={dia.clave} className={`border-t border-border ${dia.esHoy ? 'bg-blue-50/70' : ''}`}>
              <th scope="row" className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                {dia.nombre}
                {dia.esHoy ? (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-white">Hoy</span>
                ) : null}
              </th>
              <td className={`px-4 py-3 tabular-nums ${dia.atencion.length === 0 ? 'text-slate-400' : 'text-slate-700'}`}>{textoDeTramos(dia.atencion)}</td>
              {conReservas ? (
                <td className={`px-4 py-3 tabular-nums ${dia.reservas.length === 0 ? 'text-slate-400' : 'text-slate-700'}`}>{textoDeTramos(dia.reservas)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
