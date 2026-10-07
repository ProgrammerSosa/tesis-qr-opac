import { useEffect, useState } from 'react';
import { authApi } from './authApi';
import { LARGO_MINIMO_DE_CLAVE } from './claves';
import { getErrorMessage } from '../../shared/api/axiosClient';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import { Input } from '../../shared/components/FormField';
import Modal from '../../shared/components/Modal';

// Cada persona del personal cambia aquí su propia clave. Se pide la actual y, al guardar, el servidor cierra
// las demás sesiones abiertas de la cuenta.
export default function MiCuentaModal({ abierto, onCerrar }) {
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!abierto) {
      setClaveActual('');
      setClaveNueva('');
      setRepetida('');
      setError('');
      setListo(false);
    }
  }, [abierto]);

  async function guardar(e) {
    e.preventDefault();
    if (claveNueva.length < LARGO_MINIMO_DE_CLAVE) {
      setError(`La clave nueva debe tener al menos ${LARGO_MINIMO_DE_CLAVE} caracteres.`);
      return;
    }
    if (claveNueva !== repetida) {
      setError('La clave nueva y su repetición no coinciden.');
      return;
    }
    if (claveNueva === claveActual) {
      setError('La clave nueva debe ser distinta de la actual.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await authApi.cambiarClave(claveActual, claveNueva);
      setListo(true);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cambiar la clave'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open={abierto}
      title="Cambiar mi clave"
      onClose={onCerrar}
      footer={
        listo ? (
          <Button variant="primary" onClick={onCerrar}>
            Listo
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="form-mi-clave" disabled={enviando || !claveActual || !claveNueva || !repetida}>
              {enviando ? 'Guardando...' : 'Guardar clave nueva'}
            </Button>
          </>
        )
      }
    >
      {listo ? (
        <p className="text-sm text-slate-700">
          Tu clave se actualizó. Las demás sesiones abiertas de tu cuenta se cerraron; esta sigue abierta.
        </p>
      ) : (
        <form id="form-mi-clave" onSubmit={guardar} className="flex flex-col gap-3">
          <AlertBanner>{error}</AlertBanner>
          <Input
            label="Clave actual"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={claveActual}
            onChange={(e) => setClaveActual(e.target.value)}
          />
          <Input
            label="Clave nueva"
            type="password"
            required
            autoComplete="new-password"
            hint={`Al menos ${LARGO_MINIMO_DE_CLAVE} caracteres.`}
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
          />
          <Input
            label="Repite la clave nueva"
            type="password"
            required
            autoComplete="new-password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
          />
        </form>
      )}
    </Modal>
  );
}
