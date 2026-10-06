import { useState } from 'react';
import { KeyRound, LogIn } from 'lucide-react';
import { authApi } from './authApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import Button from '../../shared/components/Button';
import AlertBanner from '../../shared/components/AlertBanner';
import { Input } from '../../shared/components/FormField';

// Inicio de sesión del personal (propuesta, sección 4.5.6). Las cuentas y sus roles las define el servidor.
export default function LoginForm({ aviso, onEntrar }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

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
      onEntrar(res.data.data);
    } catch (err) {
      setClave('');
      setError(getErrorMessage(err, 'No se pudo iniciar sesión'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound size={18} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">Acceso del personal</h2>
          <p className="text-xs text-slate-500">Solo para personal autorizado de la biblioteca.</p>
        </div>
      </div>
      {aviso ? (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {aviso}
        </p>
      ) : null}
      <AlertBanner>{error}</AlertBanner>
      <Input
        label="Usuario"
        required
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
  );
}
