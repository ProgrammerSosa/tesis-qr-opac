import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Home, SearchX, TriangleAlert } from 'lucide-react';
import Container from '../shared/components/Container';
import { useTitulo } from '../shared/hooks/useTitulo';

// Página que se muestra cuando la dirección no existe (404) o cuando algo falla al cargar una página.
export default function NotFoundPage() {
  const error = useRouteError?.();
  const fallo = error && !(isRouteErrorResponse(error) && error.status === 404);
  useTitulo(fallo ? 'Algo salió mal' : 'Página no encontrada');

  return (
    <Container className="flex flex-col items-center py-20 text-center">
      <span className={`flex h-20 w-20 items-center justify-center rounded-full ${fallo ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-primary'}`}>
        {fallo ? <TriangleAlert size={36} /> : <SearchX size={36} />}
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-action">{fallo ? 'Error' : 'Error 404'}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
        {fallo ? 'Algo salió mal al cargar la página' : 'No encontramos esa página'}
      </h1>
      <p className="mt-3 max-w-md text-base text-slate-600">
        {fallo
          ? 'Ocurrió un problema inesperado. Recarga la página; si sigue igual, vuelve al inicio e inténtalo de nuevo.'
          : 'La dirección que escribiste no existe o la página cambió de lugar. Puedes volver al inicio o buscar en el catálogo.'}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg bg-action px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-action-dark">
          <Home size={17} aria-hidden="true" />
          Ir al inicio
        </Link>
        <Link to="/catalogo" className="inline-flex rounded-lg border border-border bg-white px-5 py-3 text-sm font-bold text-primary transition-colors hover:border-primary">
          Buscar en el catálogo
        </Link>
      </div>
    </Container>
  );
}
