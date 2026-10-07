import { useCallback, useEffect, useState } from 'react';
import { EyeOff, Loader2, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../adminApi';
import ModalConfirmar from '../componentes/ModalConfirmar';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { TIPO_DE_AVISO } from '../estados';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import { Checkbox, Input, Select, Textarea } from '../../../shared/components/FormField';
import { fechaConMes, hoyISO, sumarDias } from '../../../shared/utils/fechas';

const VACIO = { titulo: '', texto: '', tipo: 'info', vigenteHasta: '', activo: true };

function FormularioDeAviso({ aviso, onCerrar, onGuardado }) {
  const [form, setForm] = useState(aviso ? { titulo: aviso.titulo, texto: aviso.texto, tipo: aviso.tipo, vigenteHasta: aviso.vigenteHasta ?? '', activo: aviso.activo } : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const cambiar = (campo) => (e) => setForm((previo) => ({ ...previo, [campo]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const datos = { ...form, vigenteHasta: form.vigenteHasta || null };
    try {
      if (aviso) await adminApi.actualizarAviso(aviso.id, datos);
      else await adminApi.crearAviso(datos);
      onGuardado(aviso ? 'Aviso actualizado.' : 'Aviso publicado: ya se ve en el inicio del sitio.');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el aviso'));
      setGuardando(false);
    }
  }

  return (
    <Modal
      open
      title={aviso ? 'Editar aviso' : 'Nuevo aviso para el público'}
      onClose={guardando ? undefined : onCerrar}
      ancho="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="form-aviso" disabled={guardando}>
            {guardando ? 'Guardando...' : aviso ? 'Guardar cambios' : 'Publicar aviso'}
          </Button>
        </>
      }
    >
      <form id="form-aviso" onSubmit={enviar} className="flex flex-col gap-3">
        <AlertBanner>{error}</AlertBanner>
        <Input label="Título" required value={form.titulo} onChange={cambiar('titulo')} maxLength={120} placeholder="Por ejemplo: Cierre por inventario" />
        <Textarea label="Texto" required rows={4} value={form.texto} onChange={cambiar('texto')} maxLength={1000} hint="Explica con claridad qué cambia y cuándo." />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Tipo" value={form.tipo} onChange={cambiar('tipo')} hint="Los importantes también salen en una franja arriba de todas las páginas.">
            {Object.entries(TIPO_DE_AVISO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </Select>
          <Input label="Se muestra hasta (opcional)" type="date" min={hoyISO()} value={form.vigenteHasta} onChange={cambiar('vigenteHasta')} hint="Vacío: se muestra hasta que lo ocultes." />
        </div>
        <Checkbox checked={form.activo} onChange={(e) => setForm((previo) => ({ ...previo, activo: e.target.checked }))}>
          Mostrar este aviso en el sitio
        </Checkbox>
      </form>
    </Modal>
  );
}

// Avisos para el público (cierres, cambios de horario, novedades). Los cierres por asueto se anuncian solos desde
// «Horarios y cierres»; aquí se publica todo lo demás.
export default function AvisosPage() {
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [formulario, setFormulario] = useState(null); // null | { aviso } (aviso ausente = nuevo)
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await adminApi.avisos();
      setAvisos(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar los avisos'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function alternarActivo(aviso) {
    try {
      await adminApi.actualizarAviso(aviso.id, { activo: !aviso.activo });
      setMensaje(aviso.activo ? 'El aviso quedó oculto.' : 'El aviso se muestra de nuevo.');
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cambiar el aviso'));
    }
  }

  async function eliminar() {
    setEliminando(true);
    try {
      await adminApi.eliminarAviso(aEliminar.id);
      setMensaje('Aviso eliminado.');
      setAEliminar(null);
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar el aviso'));
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <PaginaAdmin
      descripcion="Lo que se publica aquí aparece en el inicio del sitio; los avisos importantes también se muestran en una franja en todas las páginas. Los asuetos y cierres se anuncian solos desde «Horarios y cierres»."
      acciones={
        <Button variant="primary" icon={Plus} onClick={() => setFormulario({ aviso: null })}>
          Nuevo aviso
        </Button>
      }
    >
      <AlertBanner>{error}</AlertBanner>
      {mensaje ? (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {mensaje}
        </p>
      ) : null}

      {cargando ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={18} />
          Cargando avisos...
        </div>
      ) : avisos.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <Megaphone size={30} className="text-slate-300" />
          <p className="mt-3 font-bold text-slate-900">Todavía no hay avisos</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Publica el primero para que lo vea el público en el inicio del sitio.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {avisos.map((a) => (
            <li key={a.id} className={`rounded-xl border bg-white p-5 ${a.vigente ? 'border-border' : 'border-dashed border-border opacity-75'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={a.tipo === 'importante' ? 'danger' : 'status'}>{TIPO_DE_AVISO[a.tipo]}</Badge>
                    {a.vigente ? (
                      <Badge tone="status" dot>
                        Se muestra
                      </Badge>
                    ) : (
                      <Badge tone="neutral">
                        <EyeOff size={12} />
                        {a.activo ? 'Venció' : 'Oculto'}
                      </Badge>
                    )}
                    <span className="font-mono text-xs text-slate-400">{a.id}</span>
                  </div>
                  <h2 className="mt-2 text-base font-bold text-slate-900">{a.titulo}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{a.texto}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Publicado el {fechaConMes(a.publicadoEn.slice(0, 10))}
                    {a.publicadoPor ? ` por ${a.publicadoPor}` : ''}
                    {a.vigenteHasta ? ` · se muestra hasta el ${fechaConMes(a.vigenteHasta)}${a.vigenteHasta < hoyISO() ? ' (ya venció)' : a.vigenteHasta <= sumarDias(hoyISO(), 3) ? ' (vence pronto)' : ''}` : ' · sin fecha de vencimiento'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                  <button type="button" onClick={() => setFormulario({ aviso: a })} className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Pencil size={12} />
                    Editar
                  </button>
                  <button type="button" onClick={() => alternarActivo(a)} className="text-slate-700 hover:underline">
                    {a.activo ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button type="button" onClick={() => setAEliminar(a)} className="inline-flex items-center gap-1 text-secondary hover:underline">
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formulario ? (
        <FormularioDeAviso
          aviso={formulario.aviso}
          onCerrar={() => setFormulario(null)}
          onGuardado={(texto) => {
            setFormulario(null);
            setMensaje(texto);
            cargar();
          }}
        />
      ) : null}

      <ModalConfirmar abierto={Boolean(aEliminar)} titulo="Eliminar aviso" peligro textoConfirmar="Eliminar" trabajando={eliminando} onConfirmar={eliminar} onCancelar={() => setAEliminar(null)}>
        {aEliminar ? (
          <p>
            ¿Eliminar el aviso <b>{aEliminar.titulo}</b>? Dejará de verse en el sitio. Si solo quieres quitarlo por un tiempo, usa «Ocultar».
          </p>
        ) : null}
      </ModalConfirmar>
    </PaginaAdmin>
  );
}
