import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ACENTOS = {
  blue: { barra: 'bg-primary', icono: 'bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white' },
  red: { barra: 'bg-action', icono: 'bg-red-50 text-action group-hover:bg-action group-hover:text-white' },
};

// Tarjeta de un servicio: sirve de acceso grande y claro en el inicio (también en los kioscos táctiles).
export default function ServiceCard({ to, icono: Icono, titulo, children, accion = 'Ingresar', acento = 'blue' }) {
  const estilo = ACENTOS[acento] ?? ACENTOS.blue;
  return (
    <Link
      to={to}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lift"
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${estilo.barra}`} aria-hidden="true" />
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${estilo.icono}`}>
        <Icono size={24} strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">{titulo}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{children}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
        {accion}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
