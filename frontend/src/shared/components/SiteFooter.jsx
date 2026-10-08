import { Link } from 'react-router-dom';
import Container from './Container';
import MarcaBiblioteca from './MarcaBiblioteca';
import { LIBRARY } from '../config/library';
import { SERVICIOS } from '../config/navegacion';

// Pie de página sencillo: quién es la biblioteca y sus servicios. El panel del personal es otra parte del sistema y
// no se enlaza desde el sitio público.
export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t-4 border-t-action bg-ink text-white print:hidden">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <MarcaBiblioteca tamano={64} />
          <div>
            <p className="font-display text-lg font-semibold leading-snug">{LIBRARY.nombreCorto}</p>
            <p className="text-sm text-white/70">
              {LIBRARY.facultad} · {LIBRARY.universidad}
            </p>
            <p className="mt-1 font-display text-sm italic text-blue-200">
              <span className="text-red-400">“</span>
              {LIBRARY.lema}
              <span className="text-red-400">”</span>
            </p>
          </div>
        </div>

        <nav aria-label="Servicios de la biblioteca">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {SERVICIOS.map((s) => (
              <li key={s.clave}>
                <Link to={s.to} className="text-white/75 underline-offset-2 transition-colors hover:text-white hover:underline">
                  {s.tituloCorto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
