const FIELD_CLASS =
  'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 disabled:text-slate-400';
const FIELD_ERROR_CLASS = 'border-secondary focus:border-secondary focus:ring-secondary/20';

// `hint` es una explicación corta de qué dato se pide (los kioscos deben explicar con sencillez lo que piden).
function FieldWrapper({ label, required, error, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      {label ? (
        <span className="text-[11px] font-semibold text-slate-500">
          {label} {required ? <span className="text-secondary">*</span> : null}
        </span>
      ) : null}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      {children}
      {error ? <span className="text-xs font-medium text-secondary">{error}</span> : null}
    </label>
  );
}

export function Input({ label, required, error, hint, className = '', ...props }) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <input
        className={`${FIELD_CLASS} ${error ? FIELD_ERROR_CLASS : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        {...props}
      />
    </FieldWrapper>
  );
}

export function Select({ label, required, error, hint, className = '', children, ...props }) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <select
        className={`${FIELD_CLASS} ${error ? FIELD_ERROR_CLASS : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

export function Textarea({ label, required, error, hint, className = '', rows = 4, ...props }) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <textarea
        rows={rows}
        className={`${FIELD_CLASS} resize-y ${error ? FIELD_ERROR_CLASS : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        {...props}
      />
    </FieldWrapper>
  );
}

// Casilla con su texto. El texto puede llevar enlaces, por eso se recibe como hijos.
export function Checkbox({ children, error, className = '', ...props }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 text-sm text-slate-700 ${className}`}>
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary" {...props} />
      <span>
        {children}
        {error ? <span className="mt-1 block text-xs font-medium text-secondary">{error}</span> : null}
      </span>
    </label>
  );
}
