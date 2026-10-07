import { CircleCheck, Info, OctagonAlert, TriangleAlert } from 'lucide-react';

const TONOS = {
  info: { caja: 'border-blue-200 bg-blue-50 text-blue-950', icono: Info, color: 'text-primary' },
  ok: { caja: 'border-emerald-200 bg-emerald-50 text-emerald-950', icono: CircleCheck, color: 'text-emerald-600' },
  aviso: { caja: 'border-amber-300 bg-amber-50 text-amber-950', icono: TriangleAlert, color: 'text-amber-600' },
  error: { caja: 'border-red-200 bg-red-50 text-red-950', icono: OctagonAlert, color: 'text-action' },
};

// Recuadro con una nota dentro de una página: aclaraciones, advertencias, confirmaciones.
export default function Nota({ tono = 'info', titulo, children, className = '' }) {
  const { caja, icono: Icono, color } = TONOS[tono];
  return (
    <div role={tono === 'error' ? 'alert' : 'note'} className={`flex gap-3 rounded-xl border px-4 py-3.5 text-sm leading-relaxed ${caja} ${className}`}>
      <Icono size={20} className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
      <div className="min-w-0">
        {titulo ? <p className="font-bold">{titulo}</p> : null}
        <div className={titulo ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  );
}
