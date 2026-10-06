import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { borrarSesion, leerSesion } from '../auth/sesion';

// Modo kiosco (propuesta, secciones 4.5 y 4.6). Un kiosco se abre con la dirección `/?kiosco=1` (o 2, 3...):
// el número se recuerda mientras la pestaña siga abierta. En modo kiosco, si nadie toca la pantalla
// se avisa y luego se cierra la sesión recargando la página, lo que borra lo que la persona anterior escribió.
const CLAVE = 'kiosco_id';
const SEGUNDOS_DE_INACTIVIDAD = 90;
const SEGUNDOS_DE_AVISO = 15;

const KioscoContext = createContext({ kiosco: null, esKiosco: false, registrarEvento: () => {} });

function leerKiosco() {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

function guardarKiosco(id) {
  try {
    sessionStorage.setItem(CLAVE, id);
  } catch {
    // sin almacenamiento: el kiosco se reconoce solo mientras no se recargue la página
  }
}

// Un kiosco no cierra su pestaña, así que la sesión del personal no se borra sola: si alguien dejó abierto el panel,
// se cierra aquí, en el navegador y en el servidor. `keepalive` deja que la petición termine aunque la página se recargue.
function cerrarSesionDelPersonal() {
  const sesion = leerSesion();
  if (!sesion?.token) return;
  fetch(`${axiosClient.defaults.baseURL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sesion.token}` },
    keepalive: true,
  }).catch(() => {});
  borrarSesion();
}

export function KioscoProvider({ children }) {
  const [params] = useSearchParams();
  const delParametro = params.get('kiosco');
  const [kiosco, setKiosco] = useState(leerKiosco);
  const [restante, setRestante] = useState(null);
  const sesionIniciada = useRef(false);
  const ultimaActividad = useRef(Date.now());

  useEffect(() => {
    if (delParametro && /^[0-9A-Za-z_-]{1,10}$/.test(delParametro)) {
      guardarKiosco(delParametro);
      setKiosco(delParametro);
    }
  }, [delParametro]);

  // Avisa al backend de algo que solo el navegador sabe (una búsqueda, un acceso por QR...).
  // Si falla no se interrumpe nada: las estadísticas no deben estorbar al usuario.
  const registrarEvento = useCallback(
    (tipo, extra = {}) => {
      axiosClient.post('/eventos', { tipo, kiosco, ...extra }).catch(() => {});
    },
    [kiosco]
  );

  useEffect(() => {
    if (!kiosco) return undefined;

    const alInteractuar = () => {
      ultimaActividad.current = Date.now();
      setRestante(null);
      if (!sesionIniciada.current) {
        sesionIniciada.current = true;
        registrarEvento('sesion_kiosco');
      }
    };
    const eventos = ['pointerdown', 'keydown', 'touchstart'];
    eventos.forEach((e) => window.addEventListener(e, alInteractuar));

    const reloj = setInterval(() => {
      if (!sesionIniciada.current) return;
      const inactivo = (Date.now() - ultimaActividad.current) / 1000;
      if (inactivo >= SEGUNDOS_DE_INACTIVIDAD + SEGUNDOS_DE_AVISO) {
        cerrarSesionDelPersonal();
        window.location.replace('/');
      } else if (inactivo >= SEGUNDOS_DE_INACTIVIDAD) {
        setRestante(Math.ceil(SEGUNDOS_DE_INACTIVIDAD + SEGUNDOS_DE_AVISO - inactivo));
      }
    }, 1000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, alInteractuar));
      clearInterval(reloj);
    };
  }, [kiosco, registrarEvento]);

  const valor = useMemo(() => ({ kiosco, esKiosco: Boolean(kiosco), registrarEvento }), [kiosco, registrarEvento]);

  return (
    <KioscoContext.Provider value={valor}>
      {children}
      {restante !== null ? (
        <div
          role="alertdialog"
          aria-labelledby="aviso-inactividad"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-4 print:hidden"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <ShieldCheck size={44} className="mx-auto text-primary" />
            <h2 id="aviso-inactividad" className="mt-3 text-2xl font-bold text-slate-900">
              ¿Sigues ahí?
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Por tu privacidad, la sesión se cerrará en <b className="text-action">{restante}</b> segundos y se borrará lo que
              escribiste.
            </p>
            <p className="mt-4 text-sm font-semibold text-primary">Toca la pantalla para seguir.</p>
          </div>
        </div>
      ) : null}
    </KioscoContext.Provider>
  );
}

export function useKiosco() {
  return useContext(KioscoContext);
}
