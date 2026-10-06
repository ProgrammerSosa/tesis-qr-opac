const FIELD_CLASS =
  'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 disabled:text-slate-400';

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
      {error ? <span className="text-xs text-secondary">{error}</span> : null}
    </label>
  );
}

export function Input({ label, required, error, hint, className = '', ...props }) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <input className={`${FIELD_CLASS} ${className}`} {...props} />
    </FieldWrapper>
  );
}

export function Select({ label, required, error, hint, className = '', children, ...props }) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <select className={`${FIELD_CLASS} ${className}`} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
}
