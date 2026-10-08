import { fechaSinDia, mesCorto, nombreDelDia, numeroDelDia } from '../../shared/utils/fechas';

// El día elegido, grande y con aspecto de hoja de calendario: el mes en la franja roja, el número y el nombre del día. `rotulo` dice si es
// hoy, mañana u otro día.
export default function DiaElegido({ fecha, rotulo }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4" aria-live="polite">
      <div className="flex h-24 w-20 shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-center shadow-lift ring-1 ring-slate-200">
        <span className="bg-action py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">{mesCorto(fecha)}</span>
        <span className="flex flex-1 items-center justify-center font-display text-5xl font-semibold leading-none text-slate-900 tabular-nums">
          {numeroDelDia(fecha)}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-action">{rotulo}</p>
        <p className="font-display text-3xl font-semibold capitalize leading-tight text-slate-900">{nombreDelDia(fecha)}</p>
        <p className="mt-0.5 text-sm text-slate-600">{fechaSinDia(fecha)}</p>
      </div>
    </div>
  );
}
