import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Container from './Container';
import { useTitulo } from '../hooks/useTitulo';

// Estructura común de las páginas interiores del sitio público: una franja oscura con la ruta, el título y una
// descripción, y debajo el contenido. `ancho` limita el contenido en las páginas de lectura o de formularios.
const ANCHOS = { completo: '', lectura: 'max-w-4xl', formulario: 'max-w-3xl' };

export default function Page({ crumbs = [], title, subtitle, tituloDocumento, acciones, ancho = 'completo', children }) {
  useTitulo(tituloDocumento ?? title);
  // Los títulos de tesis pueden ser muy largos: se achican para que no llenen la franja.
  const tituloLargo = typeof title === 'string' && title.length > 80;

  return (
    <>
      <section className="hero-bg border-t-4 border-t-action text-white print:hidden">
        <Container className="py-8 sm:py-10">
          {crumbs.length > 0 ? (
            <nav aria-label="Ruta de navegación">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
                {crumbs.map((miga, i) => (
                  <li key={miga.etiqueta} className="flex items-center gap-1.5">
                    {i > 0 ? <ChevronRight size={14} aria-hidden="true" className="text-white/40" /> : null}
                    {miga.to ? (
                      <Link to={miga.to} className="transition-colors hover:text-white hover:underline">
                        {miga.etiqueta}
                      </Link>
                    ) : (
                      <span aria-current="page" className="font-semibold text-white">
                        {miga.etiqueta}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0 max-w-3xl">
              <h1 className={`font-display font-semibold leading-tight tracking-tight ${tituloLargo ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>{title}</h1>
              {subtitle ? <p className="mt-2 text-base text-white/80 sm:text-lg">{subtitle}</p> : null}
            </div>
            {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
          </div>
        </Container>
      </section>
      <Container className="py-8 sm:py-10 print:py-0">
        <div className={`mx-auto ${ANCHOS[ancho]}`}>{children}</div>
      </Container>
    </>
  );
}
