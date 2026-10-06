export default function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={19} />
      </div>
      <div>
        <p className="font-serif text-2xl font-semibold leading-none text-primary-dark">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
