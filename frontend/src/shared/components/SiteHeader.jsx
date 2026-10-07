import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, MessageCircle, MonitorSmartphone, X } from 'lucide-react';
import Container from './Container';
import EstadoDeApertura from './EstadoDeApertura';
import MarcaBiblioteca from './MarcaBiblioteca';
import Redes from './Redes';
import { FranjaDeAvisos } from './Avisos';
import { ENLACE_WHATSAPP, LIBRARY } from '../config/library';
import { MENU, SERVICIOS } from '../config/navegacion';
import { useKiosco } from '../kiosco/KioscoContext';

const RUTAS_DE_SERVICIOS = SERVICIOS.filter((s) => !['catalogo', 'recursos'].includes(s.clave)).map((s) => s.to);
const ENLACE_BASE = 'relative whitespace-nowrap rounded-md px-3 py-2 text-[15px] font-semibold transition-colors';
const enlaceDeMenu = ({ isActive }) =>
  `${ENLACE_BASE} ${isActive ? 'text-primary after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-action' : 'text-slate-700 hover:bg-surface hover:text-primary'}`;

// El menú "Servicios": un panel con todos los servicios y una línea que dice qué hace cada uno.
function MenuDeServicios() {
  const [abierto, setAbierto] = useState(false);
  const referencia = useRef(null);
  const { pathname } = useLocation();
  // El catálogo y los recursos tienen su propio lugar en el menú: aquí se marcan solo los trámites y la sala de estudio.
  const enServicio = pathname === '/servicios' || RUTAS_DE_SERVICIOS.some((ruta) => pathname.startsWith(ruta));

  useEffect(() => setAbierto(false), [pathname]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsar = (e) => {
      if (referencia.current && !referencia.current.contains(e.target)) setAbierto(false);
    };
    const alTeclear = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alPulsar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alPulsar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  return (
    <div ref={referencia} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className={`${ENLACE_BASE} flex items-center gap-1 ${enServicio || abierto ? 'text-primary' : 'text-slate-700 hover:bg-surface hover:text-primary'}`}
      >
        Servicios
        <ChevronDown size={16} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
        {enServicio ? <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-action" aria-hidden="true" /> : null}
      </button>
      {abierto ? (
        <div className="entrar absolute left-1/2 top-full z-50 mt-2 w-[44rem] -translate-x-1/2 rounded-2xl border border-border bg-white p-3 shadow-lift">
          <ul className="grid grid-cols-2 gap-1">
            {SERVICIOS.map(({ clave, to, titulo, tituloCorto, icono: Icono, acento }) => (
              <li key={clave}>
                <Link to={to} className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-surface">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${acento === 'red' ? 'bg-red-50 text-action' : 'bg-blue-50 text-primary'}`}>
                    <Icono size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-primary">{tituloCorto ?? titulo}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-border px-3 pt-3 text-right">
            <Link to="/servicios" className="text-sm font-bold text-primary hover:underline">
              Ver todos los servicios →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SiteHeader() {
  const { pathname } = useLocation();
  const { kiosco, esKiosco } = useKiosco();
  const [menuMovil, setMenuMovil] = useState(false);
  const [conSombra, setConSombra] = useState(false);

  useEffect(() => setMenuMovil(false), [pathname]);

  useEffect(() => {
    const alDesplazar = () => setConSombra(window.scrollY > 8);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  return (
    <>
      <div className="print:hidden">
        <a
          href="#contenido"
          className="sr-only z-[70] rounded-md bg-white px-4 py-2 text-sm font-bold text-primary shadow-lift focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Saltar al contenido
        </a>

        <div className="bg-ink text-white">
          <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
            <EstadoDeApertura />
            <div className="flex items-center gap-4">
              {esKiosco ? (
                <span className="flex items-center gap-1.5 rounded bg-white/15 px-2 py-0.5 text-xs font-semibold">
                  <MonitorSmartphone size={14} aria-hidden="true" />
                  Kiosco {kiosco}
                </span>
              ) : (
                <>
                  <a
                    href={ENLACE_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white sm:flex"
                  >
                    <MessageCircle size={15} aria-hidden="true" />
                    WhatsApp {LIBRARY.whatsapp.texto}
                  </a>
                  <Redes claro className="hidden md:flex" />
                </>
              )}
            </div>
          </Container>
        </div>
        <FranjaDeAvisos />
      </div>

      <div className={`sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur transition-shadow print:hidden ${conSombra ? 'shadow-card' : ''}`}>
        <Container className="flex items-center justify-between gap-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={`${LIBRARY.nombreCorto}: ir al inicio`}>
            <MarcaBiblioteca tamano={52} />
            <span className="min-w-0 leading-tight">
              <span className="hidden truncate text-[15px] font-bold text-slate-900 sm:block">{LIBRARY.nombreCorto}</span>
              <span className="block truncate text-[15px] font-bold text-slate-900 sm:hidden">{LIBRARY.tituloSitio}</span>
              <span className="hidden truncate text-xs text-slate-500 sm:block">
                {LIBRARY.facultad} · USAC
              </span>
            </span>
          </Link>

          <nav aria-label="Menú principal" className="hidden items-center gap-1 xl:flex">
            {MENU.map((item) =>
              item.subMenu ? (
                <MenuDeServicios key={item.etiqueta} />
              ) : (
                <NavLink key={item.to} to={item.to} end={item.exacto} className={enlaceDeMenu}>
                  {item.etiqueta}
                </NavLink>
              )
            )}
            <Link
              to="/sala-de-estudio"
              className="ml-2 whitespace-nowrap rounded-lg bg-action px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-action-dark"
            >
              Reservar cubículo
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuMovil((v) => !v)}
            aria-expanded={menuMovil}
            aria-controls="menu-movil"
            aria-label={menuMovil ? 'Cerrar el menú' : 'Abrir el menú'}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-slate-700 transition-colors hover:border-primary hover:text-primary xl:hidden"
          >
            {menuMovil ? <X size={22} /> : <Menu size={22} />}
          </button>
        </Container>

        {menuMovil ? (
          <nav id="menu-movil" aria-label="Menú principal" className="entrar max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-border bg-white xl:hidden">
            <Container className="flex flex-col gap-1 py-3">
              {MENU.filter((item) => !item.subMenu).slice(0, 2).map((item) => (
                <NavLink key={item.to} to={item.to} end={item.exacto} className={({ isActive }) => `rounded-lg px-3 py-3 text-base font-semibold ${isActive ? 'bg-blue-50 text-primary' : 'text-slate-800 hover:bg-surface'}`}>
                  {item.etiqueta}
                </NavLink>
              ))}
              <p className="mt-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Servicios</p>
              {SERVICIOS.filter((s) => s.clave !== 'catalogo' && s.clave !== 'recursos').map(({ clave, to, titulo, tituloCorto, icono: Icono }) => (
                <NavLink key={clave} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-base font-semibold ${isActive ? 'bg-blue-50 text-primary' : 'text-slate-800 hover:bg-surface'}`}>
                  <Icono size={20} className="text-primary" aria-hidden="true" />
                  {tituloCorto ?? titulo}
                </NavLink>
              ))}
              <p className="mt-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">La biblioteca</p>
              {MENU.filter((item) => !item.subMenu).slice(2).map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `rounded-lg px-3 py-3 text-base font-semibold ${isActive ? 'bg-blue-50 text-primary' : 'text-slate-800 hover:bg-surface'}`}>
                  {item.etiqueta}
                </NavLink>
              ))}
              <Link to="/sala-de-estudio" className="mt-2 rounded-lg bg-action px-4 py-3 text-center text-base font-bold text-white">
                Reservar cubículo
              </Link>
            </Container>
          </nav>
        ) : null}
      </div>
    </>
  );
}
