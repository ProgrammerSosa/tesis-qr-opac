import { Link } from 'react-router-dom';
import { FileText, GraduationCap } from 'lucide-react';
import Badge from '../../shared/components/Badge';
import { TIPOS_DOCUMENTO } from './tiposDocumento';

// Resultado del catálogo: una tarjeta con lo esencial para decidir si abrir la ficha.
export default function ThesisCard({ tesis }) {
  const tipo = TIPOS_DOCUMENTO[tesis.tipoDocumento] ?? tesis.modalidad;
  const temas = tesis.temas ?? [];

  return (
    <Link
      to={`/tesis/${tesis.id}`}
      className="group flex gap-4 rounded-xl border border-border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift"
    >
      <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white sm:flex">
        <GraduationCap size={24} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-action">
          {tipo} · {tesis.anio}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary">{tesis.titulo}</h3>
        <p className="mt-1 text-sm text-slate-600">{tesis.autor}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="status" dot>
            {tesis.estado}
          </Badge>
          {tesis.documentoDigital?.disponible ? (
            <Badge tone="accent">
              <FileText size={12} />
              Documento digital
            </Badge>
          ) : null}
          {temas.slice(0, 3).map((tema) => (
            <span key={tema} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-slate-600">
              {tema}
            </span>
          ))}
          {tesis.signatura ? <span className="ml-auto font-mono text-xs text-slate-400">{tesis.signatura}</span> : null}
        </div>
      </div>
    </Link>
  );
}
