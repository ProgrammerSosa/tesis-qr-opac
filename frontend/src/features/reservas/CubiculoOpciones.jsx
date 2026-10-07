import { textoCubiculos, textoDuracion } from './reglasCubiculo';

export default function CubiculoOpciones({ reglas, modalidad, onModalidad, duracion, onDuracion }) {
  const regla = reglas[modalidad];
  const opciones = Array.from({ length: regla.maxHoras - regla.minHoras + 1 }, (_, i) => regla.minHoras + i);

  return (
    <div className="grid gap-5 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tipo de reserva del cubículo</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(reglas).map(([clave, r]) => {
            const activa = modalidad === clave;
            return (
              <button
                key={clave}
                type="button"
                aria-pressed={activa}
                onClick={() => onModalidad(clave)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  activa ? 'border-primary bg-blue-50 ring-2 ring-primary/30' : 'border-border bg-white hover:border-primary'
                }`}
              >
                <span className="block text-base font-bold text-slate-900">{r.nombre}</span>
                <span className="mt-0.5 block text-sm text-slate-600">
                  {textoCubiculos(r.cubiculos)} · {textoDuracion(r)}
                </span>
                <span className="block text-sm text-slate-500">Máximo {r.maxDiarias} horas al día por persona</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Duración</p>
        {opciones.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {opciones.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={duracion === h}
                onClick={() => onDuracion(h)}
                className={`min-h-11 rounded-lg px-4 py-2 font-mono text-sm transition-colors ${
                  duracion === h
                    ? 'bg-primary font-semibold text-white shadow-sm'
                    : 'border border-border bg-white text-slate-700 hover:border-primary hover:text-primary'
                }`}
              >
                {h} h
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-surface px-4 py-3 text-sm font-semibold text-slate-700">{regla.minHoras} horas (bloque fijo)</p>
        )}
      </div>
    </div>
  );
}
