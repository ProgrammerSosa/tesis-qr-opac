import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

// Ventana modal accesible: se cierra con Escape, fija el fondo mientras está abierta y se anuncia como diálogo.
export default function Modal({ open, title, onClose, children, footer, ancho = 'max-w-md' }) {
  const idTitulo = useId();
  const alCerrar = useRef(onClose);
  alCerrar.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const alTeclear = (e) => {
      if (e.key === 'Escape') alCerrar.current?.();
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener('keydown', alTeclear);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" aria-labelledby={idTitulo} className={`entrar flex max-h-[92vh] w-full flex-col rounded-2xl bg-white shadow-2xl ${ancho}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={idTitulo} className="font-heading text-base font-bold text-slate-900">
            {title}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 transition-colors hover:bg-surface hover:text-slate-700" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
