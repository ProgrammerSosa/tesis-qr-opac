import ThesisQr, { enlaceEscrito } from './ThesisQr';
import { LIBRARY } from '../../shared/config/library';

// Etiqueta para la contraportada de cada ejemplar (propuesta, sección 4.4.1): nombre de la biblioteca,
// código QR, instrucción de uso y texto alternativo de acceso. Cada tesis tiene su propio código.
export default function ThesisLabel({ tesis }) {
  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[340px] flex-col gap-2.5 rounded-lg border-[1.5px] border-dashed border-border bg-white p-4">
        <div className="flex items-center gap-1.5">
          <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm bg-primary font-heading text-[10px] font-bold text-white">
            B
          </span>
          <span className="text-[10px] font-semibold leading-tight tracking-wide text-slate-600">{LIBRARY.nombre}</span>
        </div>

        <div className="flex items-center gap-3.5">
          <ThesisQr id={tesis.id} size={66} />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug text-slate-900">Consulte la versión digital</p>
            <p className="mt-1 text-xs leading-snug text-slate-700">
              Escanea el código QR para consultar la versión digital de esta tesis.
            </p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">Escanee con la cámara de su teléfono.</p>
          </div>
        </div>

        <div className="border-t border-border pt-2 text-[11px] leading-snug text-slate-500">
          <p>
            ¿No puede escanear? Escriba: <span className="font-mono text-slate-700">{enlaceEscrito(tesis.id)}</span>
          </p>
          <p className="mt-0.5 font-mono">{tesis.id}</p>
        </div>
      </div>
    </div>
  );
}
