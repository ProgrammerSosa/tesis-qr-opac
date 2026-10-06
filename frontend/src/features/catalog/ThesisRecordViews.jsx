import { isbdText, marcFields } from './recordExport';

export function MarcView({ tesis }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-16 px-3 py-2 font-semibold">Campo</th>
            <th className="w-16 px-3 py-2 font-semibold">Ind.</th>
            <th className="px-3 py-2 font-semibold">Subcampos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {marcFields(tesis).map((f, i) => (
            <tr key={`${f.tag}-${i}`} className="align-top">
              <td className="px-3 py-2 font-mono font-semibold text-primary">{f.tag}</td>
              <td className="px-3 py-2 font-mono text-slate-500">{f.ind}</td>
              <td className="px-3 py-2">
                {f.sub.map(([code, valor]) => (
                  <span key={code} className="mr-3 inline-block">
                    <span className="font-mono text-slate-400">${code}</span> {valor}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IsbdView({ tesis }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-700">
      <p>{isbdText(tesis)}</p>
      <p>
        <span className="text-slate-500">Materias:</span> {tesis.temas.join(' · ')}
      </p>
      <p>
        <span className="text-slate-500">Resumen:</span> {tesis.resumen}
      </p>
      <p className="font-mono text-sm text-slate-500">
        {tesis.signatura} · {tesis.id}
      </p>
    </div>
  );
}
