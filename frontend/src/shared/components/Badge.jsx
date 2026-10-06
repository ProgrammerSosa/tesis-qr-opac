const TONES = {
  neutral: 'bg-slate-100 text-slate-600',
  status: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-secondary',
  accent: 'bg-accent-light text-accent',
};

export default function Badge({ tone = 'neutral', children, dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
