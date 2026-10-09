import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Globe, KeyRound, LogOut } from 'lucide-react';
import { GRUPOS, seccionesDe } from '../secciones';
import { ROLES_DEL_PERSONAL } from '../estados';
import { LIBRARY } from '../../../shared/config/library';
import { RUTA_DEL_PANEL } from '../../../shared/config/rutas';
import MarcaBiblioteca from '../../../shared/components/MarcaBiblioteca';

const CLAVE_DE_GRUPOS_ABIERTOS = 'panel.menu.grupos';

// Qué grupos tenía abiertos la persona la última vez (solo es una comodidad: si el navegador no deja guardar, no pasa nada).
function leerGruposAbiertos() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_DE_GRUPOS_ABIERTOS));
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

function guardarGruposAbiertos(grupos) {
  try {
    localStorage.setItem(CLAVE_DE_GRUPOS_ABIERTOS, JSON.stringify(grupos));
  } catch {
    // sin almacenamiento, el menú funciona igual pero no recuerda
  }
}

function iniciales(nombre) {
  return String(nombre ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('');
}

// El número rojo que avisa cuántas cosas esperan atención en una sección.
function Pastilla({ valor }) {
  return (
    <span className="min-w-[1.35rem] shrink-0 rounded-full bg-action px-1.5 text-center text-[11px] font-bold leading-5 text-white">
      {valor > 99 ? '99+' : valor}
      <span className="sr-only"> por atender</span>
    </span>
  );
}

const FOCO = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70';
const ACCION_DEL_PIE = `flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white ${FOCO}`;

// Una sección dentro de un grupo desplegado.
function EnlaceDeSeccion({ seccion, aviso, onNavegar }) {
  return (
    <NavLink
      to={`${RUTA_DEL_PANEL}/${seccion.clave}`}
      onClick={onNavegar}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${FOCO} ${
          isActive ? 'bg-primary text-white shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <seccion.icono size={16} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{seccion.etiqueta}</span>
      {aviso > 0 ? <Pastilla valor={aviso} /> : null}
    </NavLink>
  );
}

// Una sección que va sola, a la altura de los grupos (el resumen, o un grupo que para este rol solo tiene una sección).
function EnlaceSuelto({ seccion, aviso, onNavegar }) {
  return (
    <NavLink
      to={`${RUTA_DEL_PANEL}/${seccion.clave}`}
      onClick={onNavegar}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${FOCO} ${
          isActive ? 'bg-primary text-white shadow-sm' : 'text-white/90 hover:bg-white/10'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
            <seccion.icono size={17} />
          </span>
          <span className="min-w-0 flex-1 truncate">{seccion.etiqueta}</span>
          {aviso > 0 ? <Pastilla valor={aviso} /> : null}
        </>
      )}
    </NavLink>
  );
}

// Un grupo del menú: su título (con el icono y una flecha) se aprieta para mostrar u ocultar sus secciones. Cerrado, deja ver
// con un número cuántas cosas esperan atención adentro y con un punto si es donde está la persona.
function GrupoDesplegable({ grupo, secciones, abierto, contieneLaActual, avisos, onAlternar, onNavegar }) {
  const idDeLasSecciones = useId();
  const total = secciones.reduce((suma, s) => suma + (avisos[s.clave] ?? 0), 0);
  const Icono = grupo.icono;

  return (
    <li>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierto}
        aria-controls={idDeLasSecciones}
        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-white/10 ${FOCO} ${
          abierto || contieneLaActual ? 'text-white' : 'text-white/90'
        } ${contieneLaActual && !abierto ? 'bg-white/10' : ''}`}
      >
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${contieneLaActual ? 'bg-primary text-white' : 'bg-white/10'}`}>
          <Icono size={17} />
        </span>
        <span className="min-w-0 flex-1 truncate">{grupo.nombre}</span>
        {!abierto && total > 0 ? <Pastilla valor={total} /> : null}
        <ChevronDown size={16} className={`shrink-0 text-white/60 transition-transform duration-200 motion-reduce:transition-none ${abierto ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <ul id={idDeLasSecciones} inert={!abierto} className="my-1 ml-[1.35rem] flex flex-col gap-0.5 border-l border-white/10 pl-2.5">
            {secciones.map((s) => (
              <li key={s.clave}>
                <EnlaceDeSeccion seccion={s} aviso={avisos[s.clave]} onNavegar={onNavegar} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

// Navegación de la consola del personal: el resumen y los grupos de secciones (solo las que el rol puede ver), que se
// despliegan al apretar su título, y abajo quién tiene la sesión abierta con sus acciones. `avisos` trae, por sección,
// cuántas cosas esperan atención (ver useContadoresDelPanel).
export default function BarraLateral({ sesion, avisos = {}, onNavegar, onMiCuenta, onSalir }) {
  const { pathname } = useLocation();
  const visibles = seccionesDe(sesion.rol);
  const actual = visibles.find((s) => pathname === `${RUTA_DEL_PANEL}/${s.clave}`);
  const [abiertos, setAbiertos] = useState(leerGruposAbiertos);

  // Al llegar a una sección de un grupo cerrado (con un enlace del resumen, por ejemplo) el grupo se abre solo.
  useEffect(() => {
    if (actual?.grupo) setAbiertos((previos) => (previos.includes(actual.grupo) ? previos : [...previos, actual.grupo]));
  }, [actual?.grupo, pathname]);

  useEffect(() => {
    guardarGruposAbiertos(abiertos);
  }, [abiertos]);

  const alternar = (nombre) => setAbiertos((previos) => (previos.includes(nombre) ? previos.filter((g) => g !== nombre) : [...previos, nombre]));
  const rolNombre = ROLES_DEL_PERSONAL[sesion.rol]?.nombre ?? sesion.rolNombre;

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <MarcaBiblioteca tamano={44} />
        <span className="min-w-0 leading-tight">
          <span className="block text-base font-bold">Panel del personal</span>
          <span className="block truncate text-xs text-white/60">{LIBRARY.nombreCorto}</span>
        </span>
      </div>

      <nav aria-label="Secciones del panel" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-1">
          {visibles
            .filter((s) => s.grupo === null)
            .map((s) => (
              <li key={s.clave}>
                <EnlaceSuelto seccion={s} aviso={avisos[s.clave]} onNavegar={onNavegar} />
              </li>
            ))}

          {GRUPOS.map((grupo) => {
            const secciones = visibles.filter((s) => s.grupo === grupo.nombre);
            if (secciones.length === 0) return null;
            if (secciones.length === 1) {
              return (
                <li key={grupo.nombre}>
                  <EnlaceSuelto seccion={secciones[0]} aviso={avisos[secciones[0].clave]} onNavegar={onNavegar} />
                </li>
              );
            }
            return (
              <GrupoDesplegable
                key={grupo.nombre}
                grupo={grupo}
                secciones={secciones}
                abierto={abiertos.includes(grupo.nombre)}
                contieneLaActual={actual?.grupo === grupo.nombre}
                avisos={avisos}
                onAlternar={() => alternar(grupo.nombre)}
                onNavegar={onNavegar}
              />
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold" aria-hidden="true">
            {iniciales(sesion.nombre)}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">{sesion.nombre}</span>
            <span className="block truncate text-xs text-white/60">{rolNombre}</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1">
          <a href="/" target="_blank" rel="noopener noreferrer" title="Ver el sitio público (se abre en otra pestaña)" className={ACCION_DEL_PIE}>
            <Globe size={16} />
            Sitio web
            <span className="sr-only"> público (se abre en otra pestaña)</span>
          </a>
          <button type="button" onClick={onMiCuenta} title="Cambiar mi clave" className={ACCION_DEL_PIE}>
            <KeyRound size={16} />
            Mi clave
          </button>
          <button type="button" onClick={onSalir} title="Cerrar sesión" className={ACCION_DEL_PIE}>
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
