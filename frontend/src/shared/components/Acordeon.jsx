import { ChevronDown } from 'lucide-react';

// Preguntas y respuestas desplegables. Usa <details>: funciona con teclado y lectores de pantalla sin código extra.
export function ItemDeAcordeon({ pregunta, abierto = false, children }) {
  return (
    <details open={abierto} className="group rounded-xl border border-border bg-white transition-shadow open:shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-base font-semibold text-slate-900 marker:hidden hover:text-primary [&::-webkit-details-marker]:hidden">
        {pregunta}
        <ChevronDown size={20} className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-primary" />
      </summary>
      <div className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </details>
  );
}

export default function Acordeon({ children, className = '' }) {
  return <div className={`flex flex-col gap-3 ${className}`}>{children}</div>;
}
