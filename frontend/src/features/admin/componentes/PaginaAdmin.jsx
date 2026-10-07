// Estructura común de cada sección del panel: una línea que explica para qué sirve, acciones opcionales a la derecha
// y el contenido debajo. El título de la sección lo muestra el encabezado del panel.
export default function PaginaAdmin({ descripcion, acciones, children }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      {descripcion || acciones ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-3xl text-sm text-slate-600">{descripcion}</p>
          {acciones ? <div className="flex flex-wrap items-center gap-2">{acciones}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
