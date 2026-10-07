import { NavLink } from 'react-router-dom';
import { Globe, KeyRound, LogOut } from 'lucide-react';
import { GRUPOS, seccionesDe } from '../secciones';
import { ROLES_DEL_PERSONAL } from '../estados';
import { LIBRARY } from '../../../shared/config/library';
import MarcaBiblioteca from '../../../shared/components/MarcaBiblioteca';

// Navegación de la consola del personal: las secciones agrupadas (solo las que el rol puede ver),
// y abajo quién tiene la sesión abierta con sus acciones.
export default function BarraLateral({ sesion, onNavegar, onMiCuenta, onSalir }) {
  const visibles = seccionesDe(sesion.rol);

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <MarcaBiblioteca tamano={44} />
        <span className="min-w-0 leading-tight">
          <span className="block text-base font-bold">Panel del personal</span>
          <span className="block truncate text-xs text-white/60">{LIBRARY.nombreCorto}</span>
        </span>
      </div>

      <nav aria-label="Secciones del panel" className="flex-1 overflow-y-auto px-3 pb-4">
        {[null, ...GRUPOS].map((grupo) => {
          const secciones = visibles.filter((s) => s.grupo === grupo);
          if (secciones.length === 0) return null;
          return (
            <div key={grupo ?? 'inicio'} className="pt-3">
              {grupo ? (
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{grupo}</p>
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {secciones.map((s) => (
                  <li key={s.clave}>
                    <NavLink
                      to={`/admin/${s.clave}`}
                      onClick={onNavegar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                          isActive ? 'border-action bg-white/10 text-white' : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <s.icono size={17} />
                      {s.etiqueta}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold">{sesion.nombre}</p>
        <p className="text-xs text-white/60">{ROLES_DEL_PERSONAL[sesion.rol]?.nombre ?? sesion.rolNombre}</p>
        <div className="mt-3 flex flex-col gap-0.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Globe size={15} />
            Ver el sitio público
          </a>
          <button
            type="button"
            onClick={onMiCuenta}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <KeyRound size={15} />
            Cambiar mi clave
          </button>
          <button
            type="button"
            onClick={onSalir}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
