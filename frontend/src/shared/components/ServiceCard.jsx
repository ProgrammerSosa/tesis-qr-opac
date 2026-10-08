import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ACENTOS = {
  blue: { barra: 'bg-primary', icono: 'bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white group-active:bg-primary group-active:text-white' },
  red: { barra: 'bg-action', icono: 'bg-red-50 text-action group-hover:bg-action group-hover:text-white group-active:bg-action group-active:text-white' },
};

// Opción grande de la pantalla inicial (también para los kioscos táctiles): ícono, nombre, una frase y el botón.
export default function ServiceCard({ to, icono: Icono, titulo, children, accion = 'Ingresar', acento = 'blue' }) {
  const estilo = ACENTOS[acento] ?? ACENTOS.blue;
  return (
    <Link
      to={to}
      className="group relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-3xl border border-border bg-white p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lift active:scale-[0.99]"
    >
      <span className={`absolute inset-x-0 top-0 h-1.5 ${estilo.barra}`} aria-hidden="true" />
      <span className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${estilo.icono}`}>
        <Icono size={32} strokeWidth={1.75} />
      </span>
      <h3 className="mt-5 text-xl font-bold leading-snug text-slate-900">{titulo}</h3>
      <p className="mt-2 flex-1 text-base leading-relaxed text-slate-600">{children}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-base font-bold text-primary">
        {accion}
        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
