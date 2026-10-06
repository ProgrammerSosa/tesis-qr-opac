import ThesisQr from './ThesisQr';

export default function ThesisLabel({ tesis }) {
  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[300px] items-center gap-3.5 rounded-lg border-[1.5px] border-dashed border-border bg-white p-4">
        <ThesisQr id={tesis.id} size={66} />
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm bg-accent font-serif text-[10px] font-bold text-accent-light">
              B
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-slate-500">BIBLIOTECA UNIVERSITARIA</span>
          </div>
          <p className="text-xs leading-snug">Escanea para ver esta tesis en el catálogo</p>
          <p className="mt-1.5 font-mono text-[11px] text-slate-500">{tesis.id}</p>
        </div>
      </div>
    </div>
  );
}
