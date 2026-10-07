import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2, Pencil, Power, UserPlus } from 'lucide-react';
import { adminApi } from '../adminApi';
import { useSesionAdmin } from '../SesionAdmin';
import { ModalClave, ModalConfirmar, ModalEditarCuenta, ModalNuevaCuenta } from '../componentes/ModalesDePersonal';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ROLES_DEL_PERSONAL, fechaLegible } from '../estados';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';

// Cuentas del personal (solo el administrador): quién puede entrar al panel y con qué rol. Se pueden crear cuentas,
// cambiar nombre, rol o estado, y restablecer claves. Un cambio de rol o de estado cierra la sesión de esa persona.
export default function PersonalPage() {
  const { sesion } = useSesionAdmin();
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [modal, setModal] = useState(null); // { tipo: 'nueva' | 'editar' | 'clave' | 'estado', cuenta? }

  const cargar = useCallback(async () => {
    try {
      const res = await adminApi.personal();
      setCuentas(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las cuentas'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando cuentas...
      </div>
    );
  }

  const cerrarModal = () => setModal(null);
  const activas = cuentas.filter((c) => c.activa).length;

  return (
    <PaginaAdmin
      descripcion="Quién puede entrar al panel y con qué rol. Cada rol ve solo sus secciones. Un cambio de rol o de estado cierra la sesión de esa persona."
      acciones={
        <Button variant="primary" icon={UserPlus} onClick={() => setModal({ tipo: 'nueva' })}>
          Nueva cuenta
        </Button>
      }
    >
      <AlertBanner>{error}</AlertBanner>
      {aviso ? (
        <p role="status" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-primary-dark">
          {aviso}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Usuario', 'Nombre', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cuentas.map((c) => {
              const esLaPropia = c.usuario === sesion.usuario;
              return (
                <tr key={c.usuario} className="align-middle">
                  <td className="px-3 py-3 font-mono font-semibold">
                    {c.usuario}
                    {esLaPropia ? <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-primary">tú</span> : null}
                  </td>
                  <td className="px-3 py-3">{c.nombre}</td>
                  <td className="px-3 py-3">
                    <Badge tone="neutral">{ROLES_DEL_PERSONAL[c.rol]?.nombre ?? c.rolNombre}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={c.activa ? 'status' : 'danger'} dot>
                      {c.activa ? 'Activa' : 'Desactivada'}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{c.ultimoAcceso ? fechaLegible(c.ultimoAcceso) : 'Nunca'}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
                      <button type="button" onClick={() => setModal({ tipo: 'editar', cuenta: c })} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Pencil size={13} />
                        Editar
                      </button>
                      <button type="button" onClick={() => setModal({ tipo: 'clave', cuenta: c })} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <KeyRound size={13} />
                        Restablecer clave
                      </button>
                      {!esLaPropia ? (
                        <button
                          type="button"
                          onClick={() => setModal({ tipo: 'estado', cuenta: c })}
                          className={`inline-flex items-center gap-1 hover:underline ${c.activa ? 'text-secondary' : 'text-slate-700'}`}
                        >
                          <Power size={13} />
                          {c.activa ? 'Desactivar' : 'Activar'}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        {cuentas.length} cuentas, {activas} activas. Las cuentas se guardan en memoria: si se reinicia el servidor, vuelven a las iniciales
        hasta que exista una base de datos.
      </p>

      {modal?.tipo === 'nueva' ? <ModalNuevaCuenta onCerrar={cerrarModal} onCreada={cargar} /> : null}
      {modal?.tipo === 'editar' ? (
        <ModalEditarCuenta
          cuenta={modal.cuenta}
          esLaPropia={modal.cuenta.usuario === sesion.usuario}
          onCerrar={cerrarModal}
          onGuardada={(cuenta) => {
            setAviso(`Se guardaron los cambios de «${cuenta.usuario}».`);
            cargar();
          }}
        />
      ) : null}
      {modal?.tipo === 'clave' ? <ModalClave cuenta={modal.cuenta} onCerrar={cerrarModal} onRestablecida={cargar} /> : null}
      {modal?.tipo === 'estado' ? (
        <ModalConfirmar
          titulo={modal.cuenta.activa ? `Desactivar «${modal.cuenta.usuario}»` : `Activar «${modal.cuenta.usuario}»`}
          texto={
            modal.cuenta.activa
              ? `${modal.cuenta.nombre} dejará de poder entrar al panel y se cerrará su sesión abierta. Podrás activar la cuenta de nuevo cuando quieras.`
              : `${modal.cuenta.nombre} volverá a poder entrar al panel con su clave.`
          }
          textoBoton={modal.cuenta.activa ? 'Desactivar cuenta' : 'Activar cuenta'}
          onCerrar={cerrarModal}
          onConfirmar={async () => {
            await adminApi.actualizarCuenta(modal.cuenta.usuario, { activa: !modal.cuenta.activa });
            setAviso(`La cuenta «${modal.cuenta.usuario}» quedó ${modal.cuenta.activa ? 'desactivada' : 'activa'}.`);
            await cargar();
          }}
        />
      ) : null}
    </PaginaAdmin>
  );
}
