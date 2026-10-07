import { ChevronLeft, ChevronRight } from 'lucide-react';

// Números que se muestran: siempre la primera y la última página y las vecinas de la actual (1 … 4 5 6 … 20).
function numerosVisibles(pagina, paginas) {
  const conjunto = new Set([1, paginas, pagina - 1, pagina, pagina + 1]);
  if (pagina <= 3) [2, 3, 4].forEach((n) => conjunto.add(n));
  if (pagina >= paginas - 2) [paginas - 1, paginas - 2, paginas - 3].forEach((n) => conjunto.add(n));
  const ordenados = [...conjunto].filter((n) => n >= 1 && n <= paginas).sort((a, b) => a - b);
  const resultado = [];
  ordenados.forEach((n, i) => {
    if (i > 0 && n - ordenados[i - 1] > 1) resultado.push('…');
    resultado.push(n);
  });
  return resultado;
}

const BOTON = 'inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors';

export default function Paginacion({ pagina, paginas, onCambiar, className = '' }) {
  if (paginas <= 1) return null;

  return (
    <nav aria-label="Paginación de resultados" className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
        aria-label="Página anterior"
        className={`${BOTON} border-border bg-white text-slate-700 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-slate-700`}
      >
        <ChevronLeft size={18} />
        <span className="ml-1 hidden sm:inline">Anterior</span>
      </button>

      {numerosVisibles(pagina, paginas).map((n, i) =>
        n === '…' ? (
          <span key={`puntos-${i}`} className="px-1 text-slate-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onCambiar(n)}
            aria-label={`Página ${n}`}
            aria-current={n === pagina ? 'page' : undefined}
            className={`${BOTON} ${
              n === pagina ? 'border-primary bg-primary text-white shadow-sm' : 'border-border bg-white text-slate-700 hover:border-primary hover:text-primary'
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= paginas}
        aria-label="Página siguiente"
        className={`${BOTON} border-border bg-white text-slate-700 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-slate-700`}
      >
        <span className="mr-1 hidden sm:inline">Siguiente</span>
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
