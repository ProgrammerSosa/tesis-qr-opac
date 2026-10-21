// Un número con su nombre. El texto se parte en varias líneas si la tarjeta es angosta, en vez de salirse de ella.
export default function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-semibold leading-none text-primary-dark">{value}</p>
        <p className="mt-1 break-words text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
