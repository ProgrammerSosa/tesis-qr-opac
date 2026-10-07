import { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { generarClave } from '../claves';

const CAMPO =
  'w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

// Campo para escribir la clave de otra persona: se puede ver lo que se escribe y generar una clave al azar.
export default function CampoDeClave({ etiqueta = 'Clave', hint, valor, onCambio, autoFocus = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="campo-de-clave" className="text-[11px] font-semibold text-slate-500">
        {etiqueta} <span className="text-secondary">*</span>
      </label>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      <div className="flex gap-2">
        <input
          id="campo-de-clave"
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          autoComplete="new-password"
          autoFocus={autoFocus}
          required
          className={CAMPO}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar la clave' : 'Mostrar la clave'}
          className="rounded-md border border-border bg-white px-2.5 text-slate-600 hover:border-primary hover:text-primary"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          onClick={() => {
            onCambio(generarClave());
            setVisible(true);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-semibold text-primary hover:border-primary"
        >
          <Sparkles size={14} />
          Generar
        </button>
      </div>
    </div>
  );
}
