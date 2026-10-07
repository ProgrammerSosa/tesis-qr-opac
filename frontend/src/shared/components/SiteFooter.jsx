import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle } from 'lucide-react';
import Container from './Container';
import EnlaceExterno from './EnlaceExterno';
import EstadoDeApertura from './EstadoDeApertura';
import MarcaBiblioteca from './MarcaBiblioteca';
import Redes from './Redes';
import { ENLACE_WHATSAPP, ENLACES_EXTERNOS, LIBRARY } from '../config/library';
import { ENLACES_DE_LA_BIBLIOTECA, SERVICIOS } from '../config/navegacion';
import { useKiosco } from '../kiosco/KioscoContext';

// El panel del personal es otra parte del sistema y no se enlaza desde el sitio público.
const ENLACE = 'text-white/75 transition-colors hover:text-white hover:underline underline-offset-2';

export default function SiteFooter() {
  const { esKiosco } = useKiosco();

  return (
    <footer className="mt-auto border-t-4 border-t-action bg-ink text-white print:hidden">
      <Container className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <MarcaBiblioteca tamano={64} />
            <p className="font-display text-lg font-semibold leading-snug">{LIBRARY.nombreCorto}</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Biblioteca especializada en Ciencias Jurídicas y Sociales de la {LIBRARY.universidad}. Apoyamos la docencia, la
            investigación y el aprendizaje de la comunidad universitaria.
          </p>
          <p className="mt-4 font-display text-base italic text-blue-200">
            <span className="text-red-400">“</span>
            {LIBRARY.lema}
            <span className="text-red-400">”</span>
          </p>
          {!esKiosco ? <Redes claro variante="botones" className="mt-5" /> : null}
        </div>

        <nav aria-label="Servicios de la biblioteca">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-300">Servicios</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {SERVICIOS.map((s) => (
              <li key={s.clave}>
                <Link to={s.to} className={ENLACE}>
                  {s.tituloCorto ?? s.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Información de la biblioteca">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-300">La biblioteca</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {ENLACES_DE_LA_BIBLIOTECA.map((e) => (
              <li key={e.to}>
                <Link to={e.to} className={ENLACE}>
                  {e.etiqueta}
                </Link>
              </li>
            ))}
            <li>
              <EnlaceExterno href={ENLACES_EXTERNOS.usac} className={ENLACE}>
                Universidad de San Carlos de Guatemala
              </EnlaceExterno>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-300">Contacto</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-white/75">
            <li className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
              <span>
                {LIBRARY.direccion}
                {!esKiosco ? (
                  <>
                    {' '}
                    <EnlaceExterno href={LIBRARY.comoLlegar} className="font-semibold text-white underline underline-offset-2">
                      Cómo llegar
                    </EnlaceExterno>
                  </>
                ) : null}
              </span>
            </li>
            <li className="flex gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
              <span className="flex flex-col gap-1">
                <EstadoDeApertura conDetalle={false} />
                <Link to="/horarios" className="font-semibold text-white underline underline-offset-2">
                  Ver horarios
                </Link>
              </span>
            </li>
            <li className="flex gap-3">
              <MessageCircle size={18} className="mt-0.5 shrink-0 text-blue-300" aria-hidden="true" />
              <span>
                {esKiosco ? (
                  <>WhatsApp {LIBRARY.whatsapp.texto}</>
                ) : (
                  <a href={ENLACE_WHATSAPP} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline underline-offset-2">
                    WhatsApp {LIBRARY.whatsapp.texto}
                  </a>
                )}
              </span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-xs text-white/55">
          <p>
            © {new Date().getFullYear()} {LIBRARY.nombreCorto} · {LIBRARY.facultad} · USAC
          </p>
          <p>
            <Link to="/privacidad" className="hover:text-white hover:underline">
              Privacidad
            </Link>
            <span aria-hidden="true"> · </span>
            <Link to="/preguntas-frecuentes" className="hover:text-white hover:underline">
              Ayuda
            </Link>
          </p>
        </Container>
      </div>
    </footer>
  );
}
