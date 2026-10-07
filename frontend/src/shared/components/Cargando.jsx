import { Loader2 } from 'lucide-react';

export function Cargando({ texto = 'Cargando...', className = '' }) {
  return (
    <p role="status" className={`flex items-center justify-center gap-2 py-10 text-sm text-slate-500 ${className}`}>
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      {texto}
    </p>
  );
}

// Bloques grises animados que ocupan el lugar de lo que todavía no llegó (evita que la página salte al cargar).
export function Esqueleto({ className = 'h-24' }) {
  return <div className={`esqueleto ${className}`} aria-hidden="true" />;
}

export function EstadoVacio({ icono: Icono, titulo, children, accion }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
      {Icono ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-card">
          <Icono size={26} />
        </span>
      ) : null}
      <h3 className="mt-4 text-lg font-bold text-slate-900">{titulo}</h3>
      {children ? <p className="mt-1 max-w-md text-sm text-slate-600">{children}</p> : null}
      {accion ? <div className="mt-5">{accion}</div> : null}
    </div>
  );
}
