import { textoDeTramos } from '../utils/fechas';

// Horas en las que se pueden reservar lugares de estudio (cubículos, estaciones y sala de lectura), de lunes a domingo.
// Marca el día de hoy.
export default function TablaDeHorarios({ semana, className = '' }) {
  if (!semana) return null;

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-white ${className}`}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Horas de reserva de lugares de estudio por día de la semana</caption>
        <thead>
          <tr className="bg-surface text-xs font-bold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">
              Día
            </th>
            <th scope="col" className="px-4 py-3">
              Se reservan lugares de estudio
            </th>
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
              <td className={`px-4 py-3 tabular-nums ${dia.reservas.length === 0 ? 'text-slate-400' : 'text-slate-700'}`}>{textoDeTramos(dia.reservas)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
