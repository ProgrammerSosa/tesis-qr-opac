import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { adminApi } from '../adminApi';
import { LARGO_MINIMO_DE_CLAVE } from '../claves';
import { ROLES_DEL_PERSONAL } from '../estados';
import CampoDeClave from './CampoDeClave';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Button from '../../../shared/components/Button';
import { Input, Select } from '../../../shared/components/FormField';
import Modal from '../../../shared/components/Modal';

// Ventanas de la sección "Cuentas del personal". Cada una guarda su propio formulario y la página la monta solo
// mientras está abierta, así que al cerrarla no queda nada escrito para la próxima vez.

const OPCIONES_DE_ROL = Object.entries(ROLES_DEL_PERSONAL);

// Muestra la clave recién definida para que quien administra se la entregue a la persona. No se vuelve a mostrar.
function Entrega({ titulo, usuario, clave }) {
  const [copiada, setCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(clave);
      setCopiada(true);
    } catch {
      // sin portapapeles disponible: la clave está a la vista para copiarla a mano
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm text-slate-700">
      <p>{titulo}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-md border border-border bg-surface p-3">
        <dt className="text-slate-500">Usuario</dt>
        <dd className="font-mono font-semibold">{usuario}</dd>
        <dt className="text-slate-500">Clave</dt>
        <dd className="break-all font-mono font-semibold">{clave}</dd>
      </dl>
      <button type="button" onClick={copiar} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline">
        {copiada ? <Check size={15} /> : <Copy size={15} />}
        {copiada ? 'Copiada' : 'Copiar la clave'}
      </button>
      <p className="text-xs text-slate-500">
        Entrégasela a la persona por un medio seguro. Esta clave no se vuelve a mostrar; la persona puede cambiarla desde
        «Cambiar mi clave».
      </p>
    </div>
  );
}

function PieDeFormulario({ formulario, onCerrar, enviando, deshabilitado, textoBoton, textoEnviando }) {
  return (
    <>
      <Button variant="secondary" onClick={onCerrar}>
        Cancelar
      </Button>
      <Button variant="primary" type="submit" form={formulario} disabled={enviando || deshabilitado}>
        {enviando ? textoEnviando : textoBoton}
      </Button>
    </>
  );
}

export function ModalNuevaCuenta({ onCerrar, onCreada }) {
  const [usuario, setUsuario] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('circulacion');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [creada, setCreada] = useState(null);

  async function guardar(e) {
    e.preventDefault();
    if (clave.length < LARGO_MINIMO_DE_CLAVE) {
      setError(`La clave debe tener al menos ${LARGO_MINIMO_DE_CLAVE} caracteres.`);
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const res = await adminApi.crearCuenta({ usuario, nombre, rol, clave });
      setCreada({ usuario: res.data.data.usuario, clave });
      onCreada(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la cuenta'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      title={creada ? 'Cuenta creada' : 'Nueva cuenta del personal'}
      onClose={onCerrar}
      footer={
        creada ? (
          <Button variant="primary" onClick={onCerrar}>
            Listo
          </Button>
        ) : (
          <PieDeFormulario
            formulario="form-nueva-cuenta"
            onCerrar={onCerrar}
            enviando={enviando}
            deshabilitado={!usuario.trim() || !nombre.trim() || !clave}
            textoBoton="Crear cuenta"
            textoEnviando="Creando..."
          />
        )
      }
    >
      {creada ? (
        <Entrega titulo="La cuenta quedó lista. Estos son los datos para entrar:" usuario={creada.usuario} clave={creada.clave} />
      ) : (
        <form id="form-nueva-cuenta" onSubmit={guardar} className="flex flex-col gap-3">
          <AlertBanner>{error}</AlertBanner>
          <Input
            label="Usuario"
            required
            autoFocus
            autoCapitalize="none"
            hint="De 3 a 20 caracteres: letras, números, punto, guion o guion bajo."
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <Input label="Nombre de la persona o del puesto" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Select label="Rol" required hint={ROLES_DEL_PERSONAL[rol].descripcion} value={rol} onChange={(e) => setRol(e.target.value)}>
            {OPCIONES_DE_ROL.map(([valor, datos]) => (
              <option key={valor} value={valor}>
                {datos.nombre}
              </option>
            ))}
          </Select>
          <CampoDeClave
            etiqueta="Clave inicial"
            hint={`Al menos ${LARGO_MINIMO_DE_CLAVE} caracteres. Puedes generar una al azar.`}
            valor={clave}
            onCambio={setClave}
          />
        </form>
      )}
    </Modal>
  );
}

export function ModalEditarCuenta({ cuenta, esLaPropia, onCerrar, onGuardada }) {
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [rol, setRol] = useState(cuenta.rol);
  const [activa, setActiva] = useState(cuenta.activa);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cambios = {};
  if (nombre.trim().replace(/\s+/g, ' ') !== cuenta.nombre) cambios.nombre = nombre;
  if (rol !== cuenta.rol) cambios.rol = rol;
  if (activa !== cuenta.activa) cambios.activa = activa;
  const cambiaElAcceso = 'rol' in cambios || 'activa' in cambios;

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const res = await adminApi.actualizarCuenta(cuenta.usuario, cambios);
      onGuardada(res.data.data);
      onCerrar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la cuenta'));
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      title={`Editar la cuenta «${cuenta.usuario}»`}
      onClose={onCerrar}
      footer={
        <PieDeFormulario
          formulario="form-editar-cuenta"
          onCerrar={onCerrar}
          enviando={enviando}
          deshabilitado={Object.keys(cambios).length === 0 || !nombre.trim()}
          textoBoton="Guardar cambios"
          textoEnviando="Guardando..."
        />
      }
    >
      <form id="form-editar-cuenta" onSubmit={guardar} className="flex flex-col gap-3">
        <AlertBanner>{error}</AlertBanner>
        <Input label="Nombre" required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Select
          label="Rol"
          disabled={esLaPropia}
          hint={ROLES_DEL_PERSONAL[rol]?.descripcion}
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
          {OPCIONES_DE_ROL.map(([valor, datos]) => (
            <option key={valor} value={valor}>
              {datos.nombre}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activa}
            disabled={esLaPropia}
            onChange={(e) => setActiva(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Cuenta activa
        </label>
        {esLaPropia ? (
          <p className="text-xs text-slate-500">No puedes cambiar tu propio rol ni desactivar tu propia cuenta.</p>
        ) : cambiaElAcceso ? (
          <p className="text-xs text-slate-500">Al cambiar el rol o desactivar la cuenta, se cierra la sesión que la persona tenga abierta.</p>
        ) : null}
      </form>
    </Modal>
  );
}

export function ModalClave({ cuenta, onCerrar, onRestablecida }) {
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [lista, setLista] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    if (clave.length < LARGO_MINIMO_DE_CLAVE) {
      setError(`La clave debe tener al menos ${LARGO_MINIMO_DE_CLAVE} caracteres.`);
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await adminApi.restablecerClave(cuenta.usuario, clave);
      setLista(true);
      onRestablecida();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo restablecer la clave'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      title={lista ? 'Clave restablecida' : `Restablecer la clave de «${cuenta.usuario}»`}
      onClose={onCerrar}
      footer={
        lista ? (
          <Button variant="primary" onClick={onCerrar}>
            Listo
          </Button>
        ) : (
          <PieDeFormulario
            formulario="form-clave-cuenta"
            onCerrar={onCerrar}
            enviando={enviando}
            deshabilitado={!clave}
            textoBoton="Restablecer clave"
            textoEnviando="Guardando..."
          />
        )
      }
    >
      {lista ? (
        <Entrega
          titulo="La clave se cambió y se cerraron las sesiones abiertas de esa cuenta."
          usuario={cuenta.usuario}
          clave={clave}
        />
      ) : (
        <form id="form-clave-cuenta" onSubmit={guardar} className="flex flex-col gap-3">
          <AlertBanner>{error}</AlertBanner>
          <p className="text-sm text-slate-600">
            La clave actual de {cuenta.nombre} deja de servir y se cierran sus sesiones abiertas.
          </p>
          <CampoDeClave
            etiqueta="Clave nueva"
            hint={`Al menos ${LARGO_MINIMO_DE_CLAVE} caracteres. Puedes generar una al azar.`}
            valor={clave}
            onCambio={setClave}
            autoFocus
          />
        </form>
      )}
    </Modal>
  );
}

// Pide confirmar una acción que saca a alguien del sistema, como desactivar una cuenta.
export function ModalConfirmar({ titulo, texto, textoBoton, onConfirmar, onCerrar }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function confirmar() {
    setEnviando(true);
    setError('');
    try {
      await onConfirmar();
      onCerrar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar la acción'));
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      title={titulo}
      onClose={onCerrar}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Un momento...' : textoBoton}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <AlertBanner>{error}</AlertBanner>
        <p className="text-sm text-slate-700">{texto}</p>
      </div>
    </Modal>
  );
}
