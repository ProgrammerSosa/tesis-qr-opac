import { NavLink, Outlet } from 'react-router-dom';
import { Home, Search, DoorOpen, Armchair, FileCheck2, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/catalogo', label: 'Catálogo de tesis', icon: Search },
  { to: '/cubiculos', label: 'Cubículos', icon: DoorOpen },
  { to: '/espacios-estudio', label: 'Espacios de estudio', icon: Armchair },
  { to: '/solvencia', label: 'Solicitud de solvencia', icon: FileCheck2 },
  { to: '/admin', label: 'Panel administrativo', icon: LayoutDashboard },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 shrink-0 flex-col bg-primary text-white">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent font-serif text-base font-bold text-accent-light">
            B
          </div>
          <div className="leading-tight">
            <p className="font-serif text-sm font-semibold">Biblioteca universitaria</p>
            <p className="text-[10.5px] text-white/60">Kiosco · OPAC · Reservas</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-[10.5px] leading-relaxed text-white/45">
          Propuesta de diseño — Anexos 1 a 3
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
        <Outlet />
      </main>
    </div>
  );
}
