import { Search } from 'lucide-react';

// Búsqueda por texto (opcional) y filtros desplegables sobre una tabla. Cada filtro es { etiqueta, valor, onCambio,
// opciones } con `opciones` como pares [valor, texto]; la etiqueta hace de primera opción ("todos").
export default function BarraDeFiltros({ busqueda, onBusqueda, placeholder, filtros = [], resumen }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onBusqueda ? (
        <label className="relative min-w-[14rem] flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      ) : null}
      {filtros.map((filtro) => (
        <label key={filtro.etiqueta}>
          <span className="sr-only">{filtro.etiqueta}</span>
          <select
            value={filtro.valor}
            onChange={(e) => filtro.onCambio(e.target.value)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">{filtro.etiqueta}</option>
            {filtro.opciones.map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
      ))}
      {resumen ? <span className="text-xs text-slate-500">{resumen}</span> : null}
    </div>
  );
}
