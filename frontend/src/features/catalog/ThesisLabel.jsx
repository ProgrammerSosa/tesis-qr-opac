import ThesisQr, { destinoDelQrDe, enlaceEscrito } from './ThesisQr';
import { LIBRARY } from '../../shared/config/library';

// Etiqueta para la contraportada de cada ejemplar (propuesta, sección 4.4.1): nombre de la biblioteca,
// código QR, instrucción de uso y texto alternativo de acceso. Cada tesis tiene su propio código.
// El código lleva adonde diga la tesis (su URL o su ficha); cuanto más largo es el enlace, más cuadros tiene el código, así que
// se dibuja más grande para que siga leyéndose bien al imprimirlo.
function tamanoDelCodigo(enlace) {
  if (enlace.length > 200) return 150;
  if (enlace.length > 130) return 128;
  if (enlace.length > 90) return 104;
  if (enlace.length > 60) return 84;
  return 66;
}

export default function ThesisLabel({ tesis }) {
  const destino = destinoDelQrDe(tesis);
  const tamano = tamanoDelCodigo(destino.enlace);

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
          <ThesisQr id={tesis.id} size={tamano} enlace={destino.enlace} />
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
