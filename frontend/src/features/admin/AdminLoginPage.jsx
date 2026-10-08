import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { authApi } from './authApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { guardarSesion } from '../../shared/auth/sesion';
import { puedeVer } from './secciones';
import { LIBRARY } from '../../shared/config/library';
import { RUTA_DEL_PANEL } from '../../shared/config/rutas';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import MarcaBiblioteca from '../../shared/components/MarcaBiblioteca';
import { Input } from '../../shared/components/FormField';

const AVISOS = { terminada: 'Tu sesión terminó. Inicia sesión de nuevo para continuar.' };

// A dónde ir después de entrar: a la página que se quería ver, si era del panel y el rol puede verla; si no, al inicio del panel.
function destinoTras(desde, rol) {
  if (typeof desde !== 'string' || !desde.startsWith(`${RUTA_DEL_PANEL}/`) || desde.startsWith(`${RUTA_DEL_PANEL}/acceso`)) return RUTA_DEL_PANEL;
  const seccion = desde.split(/[/?#]/)[2];
  return puedeVer(rol, seccion) ? desde : RUTA_DEL_PANEL;
}

// Inicio de sesión del personal (propuesta, sección 4.5.6): pantalla propia, sin el diseño del sitio público.
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [parametros] = useSearchParams();
  // La guardia de rutas manda a quien no tiene sesión aquí con la página que quería ver (?desde=) y, si hace falta, el motivo (?aviso=).
  const desde = location.state?.desde ?? parametros.get('desde');
  const aviso = location.state?.aviso || AVISOS[parametros.get('aviso')];
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const original = document.title;
    document.title = 'Acceso · Panel del personal';
    return () => {
      document.title = original;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!usuario.trim() || !clave) {
      setError('Escribe tu usuario y tu clave.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const res = await authApi.login(usuario.trim(), clave);
      guardarSesion(res.data.data);
      navigate(destinoTras(desde, res.data.data.rol), { replace: true });
    } catch (err) {
      setClave('');
      setError(getErrorMessage(err, 'No se pudo iniciar sesión'));
      setEnviando(false);
    }
  }

  return (
    <main className="hero-bg flex min-h-screen flex-col items-center justify-center px-4 py-10 text-white">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <MarcaBiblioteca tamano={84} />
        <h1 className="text-3xl font-extrabold tracking-tight">Panel del personal</h1>
        <p className="max-w-xs text-sm text-white/70">{LIBRARY.nombre}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 text-slate-900 shadow-2xl shadow-black/40">
        {aviso ? (
          <p role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {aviso}
          </p>
        ) : null}
        <AlertBanner>{error}</AlertBanner>
        <Input
          label="Usuario"
          required
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
        <Input
          label="Clave"
          type="password"
          required
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
        <Button type="submit" variant="primary" icon={LogIn} disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 max-w-xs text-center text-xs text-white/50">Acceso exclusivo para el personal autorizado de la biblioteca.</p>
    </main>
  );
}
