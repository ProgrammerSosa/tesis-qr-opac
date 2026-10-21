import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '../../../shared/components/FormField';
import { MODOS, moverReferencia, nombreDelPeriodo, rangoDe } from '../periodos';

const NAVEGABLES = ['dia', 'semana', 'mes', 'anio'];
const VOLVER = { dia: 'Hoy', semana: 'Esta semana', mes: 'Este mes', anio: 'Este año' };

function Flecha({ etiqueta, onClick, deshabilitada, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitada}
      aria-label={etiqueta}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-slate-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:text-slate-600"
    >
      {children}
    </button>
  );
}

// Elige el período de las estadísticas: un día, una semana, un mes o un año (con flechas para ir al anterior o al siguiente), todo lo
// registrado o un rango de fechas. `valor` es { modo, referencia, rango }; `onCambiar` recibe el valor nuevo completo.
export default function PeriodoDeEstadisticas({ valor, hoy, onCambiar }) {
  const { modo, referencia, rango } = valor;
  const periodo = modo === 'rango' ? rango : rangoDe(modo, referencia);
  const navegable = NAVEGABLES.includes(modo);
  const siguienteEsFuturo = navegable && rangoDe(modo, moverReferencia(modo, referencia, 1)).desde > hoy;
  const contieneHoy = navegable && periodo.desde <= hoy && hoy <= periodo.hasta;
  const cambiar = (cambios) => onCambiar({ ...valor, ...cambios });

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4" aria-label="Período de las estadísticas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid w-full grid-cols-3 rounded-lg border border-border bg-white p-0.5 sm:inline-flex sm:w-auto sm:flex-wrap" role="group" aria-label="Ver por">
          {MODOS.map(([clave, texto]) => (
            <button
              key={clave}
              type="button"
              onClick={() => cambiar({ modo: clave })}
              aria-pressed={modo === clave}
              className={`whitespace-nowrap rounded-md px-1.5 py-1.5 text-[13px] font-semibold transition-colors sm:px-3 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                modo === clave ? 'bg-primary text-white' : 'text-slate-600 hover:bg-surface'
              }`}
            >
              {texto}
            </button>
          ))}
        </div>

        {navegable ? (
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Flecha etiqueta="Período anterior" onClick={() => cambiar({ referencia: moverReferencia(modo, referencia, -1) })}>
              <ChevronLeft size={18} aria-hidden="true" />
            </Flecha>
            <p className="min-w-0 flex-1 text-center text-sm font-bold text-slate-900 sm:w-60 sm:flex-none" aria-live="polite">
              {nombreDelPeriodo(modo, periodo)}
            </p>
            <Flecha etiqueta="Período siguiente" onClick={() => cambiar({ referencia: moverReferencia(modo, referencia, 1) })} deshabilitada={siguienteEsFuturo}>
              <ChevronRight size={18} aria-hidden="true" />
            </Flecha>
          </div>
        ) : (
          <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900" aria-live="polite">
            <CalendarDays size={16} className="shrink-0 text-primary" aria-hidden="true" />
            {nombreDelPeriodo(modo, periodo)}
          </p>
        )}
      </div>

      {modo === 'dia' || modo === 'semana' || modo === 'rango' || (navegable && !contieneHoy) ? (
        <div className="flex flex-wrap items-end gap-3">
          {modo === 'dia' || modo === 'semana' ? (
            <div className="w-full sm:w-44">
              <Input label={modo === 'dia' ? 'Ir al día' : 'Ir a la semana del día'} type="date" value={referencia} max={hoy} onChange={(e) => e.target.value && cambiar({ referencia: e.target.value })} />
            </div>
          ) : null}
          {modo === 'rango' ? (
            <>
              <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
                <Input
                  label="Desde"
                  type="date"
                  value={rango.desde}
                  max={rango.hasta || hoy}
                  onChange={(e) => e.target.value && cambiar({ rango: { ...rango, desde: e.target.value } })}
                />
              </div>
              <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
                <Input
                  label="Hasta"
                  type="date"
                  value={rango.hasta}
                  min={rango.desde}
                  onChange={(e) => e.target.value && cambiar({ rango: { ...rango, hasta: e.target.value } })}
                />
              </div>
            </>
          ) : null}
          {navegable && !contieneHoy ? (
            <button
              type="button"
              onClick={() => cambiar({ referencia: hoy })}
              className="min-h-9 rounded-full border border-border bg-white px-4 text-sm font-bold text-primary transition-colors hover:border-primary"
            >
              {VOLVER[modo]}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
