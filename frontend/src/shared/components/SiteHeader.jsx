import { Link, useLocation } from 'react-router-dom';
import { Armchair, BookOpen, FileCheck2, Home, LayoutDashboard, Search } from 'lucide-react';
import HeroSearch from './HeroSearch';
import { LIBRARY } from '../config/library';

const TOP_LINKS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/catalogo', label: 'Catálogo de tesis', icon: Search },
];

const HERO_LINKS = [
  { to: '/catalogo?avanzada=1', label: 'Búsqueda avanzada' },
  { to: '/sala-de-estudio', label: 'Sala de estudio' },
  { to: '/solvencia', label: 'Solvencia' },
];

const SERVICIOS = [
  { to: '/catalogo', label: 'Catálogo de tesis', icon: BookOpen, ring: 'border-red-500 hover:shadow-red-500/30' },
  { to: '/sala-de-estudio', label: 'Sala de estudio', icon: Armchair, ring: 'border-blue-400 hover:shadow-blue-400/30' },
  { to: '/solvencia', label: 'Solicitud de solvencia', icon: FileCheck2, ring: 'border-white hover:shadow-white/20' },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const esInicio = pathname === '/';

  return (
    <header className="print:hidden">
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2.5 text-sm font-medium sm:px-6">
          <nav className="flex items-center gap-5">
            {TOP_LINKS.map((item) => (
              <Link key={item.to} to={item.to} className="flex items-center gap-1.5 text-white/85 transition-colors hover:text-white">
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
          <Link to="/admin" className="flex items-center gap-1.5 text-white/85 transition-colors hover:text-white">
            <LayoutDashboard size={16} />
            Panel administrativo
          </Link>
        </div>
      </div>

      <div className="hero-bg border-t-4 border-t-action text-white">
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${esInicio ? 'py-8 sm:py-12' : 'py-5'}`}>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
            <Link to="/" className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white font-heading text-2xl font-extrabold text-primary shadow-lg shadow-black/30 ring-4 ring-primary/40">
                B
              </span>
              <span className="leading-tight">
                <span className="block text-sm text-white/70">{LIBRARY.nombre}</span>
                <span className="block text-2xl font-bold">Catálogo</span>
              </span>
            </Link>
            <nav className="flex flex-wrap gap-x-8 gap-y-2 text-base font-medium md:ml-auto">
              {HERO_LINKS.map((item) => {
                const activo = !item.to.includes('?') && pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`border-b-2 pb-0.5 transition-colors hover:border-action hover:text-white ${
                      activo ? 'border-action text-white' : 'border-transparent text-white/85'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {esInicio ? (
            <div className="mt-10 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
                Repositorio de <span className="text-red-500">Tesis</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
                Catálogo de Acceso Público en Línea (OPAC). Busca una tesis, reserva un espacio o inicia tu solicitud de
                solvencia desde esta pantalla.
              </p>
            </div>
          ) : null}

          <div className={`mx-auto max-w-4xl ${esInicio ? 'mt-8' : 'mt-5'}`}>
            <HeroSearch />
          </div>

          {esInicio ? (
            <ul className="mt-12 flex flex-wrap justify-center gap-5 sm:gap-8">
              {SERVICIOS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex h-36 w-36 flex-col items-center justify-center gap-2.5 rounded-full border-4 bg-white/5 px-4 text-center text-sm font-semibold backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/15 hover:shadow-2xl sm:h-44 sm:w-44 sm:text-base ${item.ring}`}
                  >
                    <item.icon size={38} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </header>
  );
}
