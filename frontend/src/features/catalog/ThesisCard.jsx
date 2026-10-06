import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import Badge from '../../shared/components/Badge';
import { TIPOS_DOCUMENTO } from './tiposDocumento';

export default function ThesisCard({ tesis }) {
  return (
    <Link
      to={`/tesis/${tesis.id}`}
      className="group flex flex-col gap-1.5 rounded-lg border border-l-4 border-border border-l-primary bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-l-action hover:shadow-md"
    >
      <p className="text-base font-semibold leading-snug text-primary group-hover:underline">{tesis.titulo}</p>
      <p className="text-sm text-slate-700">
        {tesis.autor} · {tesis.anio} · {TIPOS_DOCUMENTO[tesis.tipoDocumento] ?? tesis.modalidad}
      </p>
      <p className="text-sm text-slate-500">Tema(s): {tesis.temas.join(', ')}</p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Badge tone="status" dot>
          {tesis.estado}
        </Badge>
        {tesis.documentoDigital?.disponible ? (
          <Badge tone="accent">
            <FileText size={12} />
            Documento digital
          </Badge>
        ) : null}
        <span className="font-mono text-xs text-slate-500">{tesis.signatura}</span>
      </div>
    </Link>
  );
}
