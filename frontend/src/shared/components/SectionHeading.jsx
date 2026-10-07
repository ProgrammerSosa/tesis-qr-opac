// Encabezado de una sección del sitio público: una etiqueta pequeña, el título en tipografía serif y, si hace falta,
// una explicación y una acción a la derecha.
export default function SectionHeading({ etiqueta, children, descripcion, accion, centrado = false, as: Etiqueta = 'h2', claro = false }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${centrado ? 'justify-center text-center' : ''}`}>
      <div className={centrado ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
        {etiqueta ? (
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${claro ? 'text-red-300' : 'text-action'}`}>{etiqueta}</p>
        ) : null}
        <Etiqueta className={`font-display text-2xl font-semibold leading-snug sm:text-3xl ${claro ? 'text-white' : 'text-slate-900'} ${etiqueta ? 'mt-1.5' : ''}`}>
          {children}
        </Etiqueta>
        {descripcion ? <p className={`mt-2 text-base ${claro ? 'text-white/75' : 'text-slate-600'}`}>{descripcion}</p> : null}
      </div>
      {accion ? <div className="shrink-0">{accion}</div> : null}
    </div>
  );
}
