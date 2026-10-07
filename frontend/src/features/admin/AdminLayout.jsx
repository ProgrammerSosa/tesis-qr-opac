import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Clock, Menu } from 'lucide-react';
import { authApi } from './authApi';
import BarraLateral from './componentes/BarraLateral';
import MiCuentaModal from './MiCuentaModal';
import { SECCIONES } from './secciones';
import { ProveedorDeSesion } from './SesionAdmin';
import { useCierrePorInactividad } from './useCierrePorInactividad';
import { ROLES_DEL_PERSONAL } from './estados';
import { EVENTO_SESION_EXPIRADA } from '../../shared/api/axiosClient';
import { borrarSesion, leerSesion } from '../../shared/auth/sesion';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';

const MINUTOS_DE_INACTIVIDAD = 20;
const SEGUNDOS_DE_AVISO = 60;

const AVISO_SESION_TERMINADA = 'Tu sesión terminó. Inicia sesión de nuevo para continuar.';
const AVISO_INACTIVIDAD = 'Cerramos tu sesión por inactividad. Inicia sesión de nuevo para continuar.';

// Diseño de la consola del personal: barra lateral con las secciones, encabezado y contenido. Es independiente del
// diseño del sitio público (no usa su encabezado, buscador ni pie de página) y exige haber iniciado sesión.
export default function AdminLayout() {
  const location = useLocation();
  const [sesion, setSesion] = useState(leerSesion);
  const [motivoDeSalida, setMotivoDeSalida] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [miCuentaAbierta, setMiCuentaAbierta] = useState(false);
  const tituloOriginal = useRef(document.title);

  const cerrarEnEsteNavegador = useCallback((motivo = '') => {
    borrarSesion();
    setMotivoDeSalida(motivo);
    setSesion(null);
  }, []);

  const cerrarSesion = useCallback(
    async (motivo = '') => {
      try {
        await authApi.logout();
      } catch {
        // si el servidor ya no reconoce la sesión, igual se cierra aquí
      }
      cerrarEnEsteNavegador(motivo);
    },
    [cerrarEnEsteNavegador]
  );

  // El cliente de la API avisa cuando el servidor deja de reconocer la sesión (venció o el servidor se reinició).
  useEffect(() => {
    const alExpirar = () => {
      setMotivoDeSalida(AVISO_SESION_TERMINADA);
      setSesion(null);
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const segundosRestantes = useCierrePorInactividad({
    activo: Boolean(sesion),
    minutos: MINUTOS_DE_INACTIVIDAD,
    avisoSegundos: SEGUNDOS_DE_AVISO,
    alCerrar: () => cerrarSesion(AVISO_INACTIVIDAD),
  });

  // El cajón del menú (pantallas chicas) se cierra al cambiar de sección y con Escape.
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAbierto) return undefined;
    const alTeclear = (e) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [menuAbierto]);

  const seccion = SECCIONES.find((s) => location.pathname === `/admin/${s.clave}`);
  const titulo = seccion?.titulo ?? 'Panel del personal';

  useEffect(() => {
    document.title = `${titulo} · Panel del personal`;
  }, [titulo]);

  useEffect(() => {
    const original = tituloOriginal.current;
    return () => {
      document.title = original;
    };
  }, []);

  const valor = useMemo(
    () => ({ sesion, abrirMiCuenta: () => setMiCuentaAbierta(true), cerrarSesion }),
    [sesion, cerrarSesion]
  );

  if (!sesion) {
    return <Navigate to="/admin/acceso" replace state={{ desde: `${location.pathname}${location.search}`, aviso: motivoDeSalida }} />;
  }

  return (
    <ProveedorDeSesion value={valor}>
      <div className="flex min-h-screen bg-surface">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block print:hidden">
          <BarraLateral sesion={sesion} onMiCuenta={() => setMiCuentaAbierta(true)} onSalir={() => cerrarSesion()} />
        </aside>

        {menuAbierto ? (
          <div className="fixed inset-0 z-40 lg:hidden print:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel">
            <button type="button" aria-label="Cerrar el menú" className="absolute inset-0 bg-ink/60" onClick={() => setMenuAbierto(false)} />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-2xl">
              <BarraLateral
                sesion={sesion}
                onNavegar={() => setMenuAbierto(false)}
                onMiCuenta={() => {
                  setMenuAbierto(false);
                  setMiCuentaAbierta(true);
                }}
                onSalir={() => cerrarSesion()}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-white px-4 py-3 sm:px-6 print:hidden">
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir el menú"
              className="rounded-md p-1.5 text-slate-600 hover:bg-surface lg:hidden"
            >
              <Menu size={22} />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-slate-900 sm:text-xl">{titulo}</h1>
            <div className="hidden items-center gap-2.5 text-sm sm:flex">
              <span className="font-semibold text-slate-800">{sesion.nombre}</span>
              <Badge tone="status">{ROLES_DEL_PERSONAL[sesion.rol]?.nombre ?? sesion.rolNombre}</Badge>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <MiCuentaModal abierto={miCuentaAbierta} onCerrar={() => setMiCuentaAbierta(false)} />

      {segundosRestantes !== null ? (
        <div
          role="alertdialog"
          aria-labelledby="aviso-inactividad-admin"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4 print:hidden"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <Clock size={34} className="mx-auto text-primary" />
            <h2 id="aviso-inactividad-admin" className="mt-2 text-xl font-bold text-slate-900">
              ¿Sigues ahí?
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Por seguridad, tu sesión se cerrará en <b className="text-action">{segundosRestantes}</b> segundos por inactividad.
            </p>
            <Button variant="primary" className="mt-4 w-full" autoFocus>
              Seguir conectado
            </Button>
          </div>
        </div>
      ) : null}
    </ProveedorDeSesion>
  );
}
