// Lista de pasos numerados con una línea que los une: se usa para explicar los trámites (solvencia, tesis digital...).
// Cada paso: { titulo, texto, extra } — `extra` puede ser un enlace, una nota o cualquier elemento.
export default function Pasos({ pasos, className = '' }) {
  return (
    <ol className={`flex flex-col ${className}`}>
      {pasos.map((paso, i) => (
        <li key={paso.titulo} className="relative flex gap-4 pb-7 last:pb-0">
          {i < pasos.length - 1 ? <span className="absolute left-[19px] top-10 bottom-1 w-px bg-border" aria-hidden="true" /> : null}
          <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white shadow-sm ring-4 ring-white">
            {i + 1}
          </span>
          <div className="min-w-0 pt-1.5">
            <h3 className="text-base font-bold text-slate-900">{paso.titulo}</h3>
            {paso.texto ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{paso.texto}</p> : null}
            {paso.extra ? <div className="mt-2">{paso.extra}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
