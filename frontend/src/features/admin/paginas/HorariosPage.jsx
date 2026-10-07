import { useCallback, useEffect, useState } from 'react';
import { CalendarX, Check, Copy, Loader2, Plus, Trash2, X } from 'lucide-react';
import { adminApi } from '../adminApi';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Button from '../../../shared/components/Button';
import { Input } from '../../../shared/components/FormField';
import { fechaConMes, hoyISO } from '../../../shared/utils/fechas';

const DIAS = [
  ['lunes', 'Lunes'],
  ['martes', 'Martes'],
  ['miercoles', 'Miércoles'],
  ['jueves', 'Jueves'],
  ['viernes', 'Viernes'],
  ['sabado', 'Sábado'],
  ['domingo', 'Domingo'],
];
const ENTRE_SEMANA = ['martes', 'miercoles', 'jueves', 'viernes'];
const MAXIMO_DE_TRAMOS = 3;

// Editor de la semana: cada día tiene hasta tres tramos [desde, hasta]. Sin tramos, ese día no hay servicio.
function EditorDeSemana({ titulo, descripcion, semana, onGuardar }) {
  const [borrador, setBorrador] = useState(semana);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // El borrador solo se reinicia cuando el contenido guardado cambia de verdad (no cada vez que se vuelve a pedir la página):
  // así lo que se está escribiendo en un editor no se pierde al agregar un cierre.
  const guardado = JSON.stringify(semana);
  useEffect(() => setBorrador(JSON.parse(guardado)), [guardado]);

  const hayCambios = JSON.stringify(borrador) !== guardado;

  function cambiarTramos(dia, tramos) {
    setBorrador((previo) => ({ ...previo, [dia]: tramos }));
    setMensaje({ tipo: '', texto: '' });
  }

  function cambiarHora(dia, indice, posicion, valor) {
    cambiarTramos(dia, borrador[dia].map((t, i) => (i === indice ? t.map((h, j) => (j === posicion ? valor : h)) : t)));
  }

  function copiarLunes() {
    setBorrador((previo) => ({ ...previo, ...Object.fromEntries(ENTRE_SEMANA.map((d) => [d, previo.lunes.map((t) => [...t])])) }));
    setMensaje({ tipo: '', texto: '' });
  }

  async function guardar() {
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      await onGuardar(borrador);
      setMensaje({ tipo: 'ok', texto: 'Horarios guardados: ya rigen en el sitio.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: getErrorMessage(err, 'No se pudieron guardar los horarios') });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white" aria-label={titulo}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="max-w-2xl">
          <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
          <p className="mt-0.5 text-sm text-slate-600">{descripcion}</p>
        </div>
        <Button variant="secondary" icon={Copy} onClick={copiarLunes}>
          Copiar el lunes a martes–viernes
        </Button>
      </div>

      <ul className="divide-y divide-border">
        {DIAS.map(([clave, nombre]) => (
          <li key={clave} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-start">
            <p className="w-28 shrink-0 pt-2 text-sm font-semibold text-slate-900">{nombre}</p>
            <div className="flex flex-1 flex-col gap-2">
              {borrador[clave].length === 0 ? <p className="pt-2 text-sm text-slate-400">Cerrado</p> : null}
              {borrador[clave].map((tramo, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${nombre}, tramo ${i + 1}: desde`}
                    value={tramo[0]}
                    onChange={(e) => cambiarHora(clave, i, 0, e.target.value)}
                    className="rounded-md border border-border bg-white px-2.5 py-1.5 text-sm tabular-nums outline-none focus:border-primary"
                  />
                  <span className="text-sm text-slate-500">a</span>
                  <input
                    type="time"
                    aria-label={`${nombre}, tramo ${i + 1}: hasta`}
                    value={tramo[1]}
                    onChange={(e) => cambiarHora(clave, i, 1, e.target.value)}
                    className="rounded-md border border-border bg-white px-2.5 py-1.5 text-sm tabular-nums outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    aria-label={`Quitar el tramo ${i + 1} del ${nombre.toLowerCase()}`}
                    onClick={() => cambiarTramos(clave, borrador[clave].filter((_, j) => j !== i))}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-surface hover:text-secondary"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {borrador[clave].length < MAXIMO_DE_TRAMOS ? (
                <button
                  type="button"
                  onClick={() => cambiarTramos(clave, [...borrador[clave], borrador[clave].length === 0 ? ['08:00', '17:00'] : ['14:00', '17:00']])}
                  className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline"
                >
                  <Plus size={13} />
                  {borrador[clave].length === 0 ? 'Abrir este día' : 'Agregar otro tramo'}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3">
        <Button variant="brand" icon={guardando ? Loader2 : Check} onClick={guardar} disabled={!hayCambios || guardando}>
          {guardando ? 'Guardando...' : 'Guardar horarios'}
        </Button>
        {hayCambios ? (
          <button type="button" onClick={() => setBorrador(semana)} className="text-sm font-semibold text-slate-500 hover:text-action">
            Descartar cambios
          </button>
        ) : null}
        {mensaje.texto ? <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-emerald-700' : 'text-secondary'}`}>{mensaje.texto}</p> : null}
      </div>
    </section>
  );
}

// Días de cierre: asuetos, vacaciones o inventario. Ese día no hay atención, no se pueden hacer reservas y las solvencias
// no se entregan.
function DiasDeCierre({ cierres, onCambio }) {
  const [form, setForm] = useState({ desde: '', hasta: '', motivo: '' });
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const hoy = hoyISO();

  async function agregar(e) {
    e.preventDefault();
    setTrabajando(true);
    setError('');
    try {
      await adminApi.agregarCierre({ desde: form.desde, hasta: form.hasta || form.desde, motivo: form.motivo });
      setForm({ desde: '', hasta: '', motivo: '' });
      await onCambio();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo registrar el cierre'));
    } finally {
      setTrabajando(false);
    }
  }

  async function quitar(cierre) {
    try {
      await adminApi.quitarCierre(cierre.id);
      await onCambio();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo quitar el cierre'));
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white" aria-label="Días de cierre">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">Días de cierre</h2>
        <p className="mt-0.5 max-w-2xl text-sm text-slate-600">
          Asuetos, vacaciones o inventario. Ese día no hay atención, no se pueden hacer reservas y las solvencias no se entregan. El sitio lo anuncia solo desde
          una semana antes.
        </p>
      </div>

      <form onSubmit={agregar} className="grid gap-3 border-b border-border px-5 py-4 sm:grid-cols-[10rem_10rem_1fr_auto] sm:items-end">
        <Input label="Desde" type="date" required value={form.desde} min={hoy} onChange={(e) => setForm((p) => ({ ...p, desde: e.target.value, hasta: p.hasta && p.hasta < e.target.value ? e.target.value : p.hasta }))} />
        <Input label="Hasta (si es un solo día, déjalo vacío)" type="date" value={form.hasta} min={form.desde || hoy} onChange={(e) => setForm((p) => ({ ...p, hasta: e.target.value }))} />
        <Input label="Motivo" required maxLength={120} value={form.motivo} onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))} placeholder="Por ejemplo: Día de la Independencia" />
        <Button type="submit" variant="primary" icon={Plus} disabled={trabajando || !form.desde || form.motivo.trim().length < 3}>
          {trabajando ? 'Agregando...' : 'Agregar cierre'}
        </Button>
      </form>

      <div className="px-5 py-3">
        <AlertBanner>{error}</AlertBanner>
        {cierres.length === 0 ? (
          <p className="py-3 text-sm text-slate-400">No hay días de cierre registrados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {cierres.map((c) => {
              const paso = c.hasta < hoy;
              return (
                <li key={c.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${paso ? 'opacity-50' : ''}`}>
                  <span className="flex items-start gap-3">
                    <CalendarX size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{c.motivo}</span>
                      <span className="block text-xs text-slate-500">
                        {c.desde === c.hasta ? fechaConMes(c.desde) : `Del ${fechaConMes(c.desde)} al ${fechaConMes(c.hasta)}`}
                        {paso ? ' · ya pasó' : ''}
                      </span>
                    </span>
                  </span>
                  <button type="button" onClick={() => quitar(c)} className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline">
                    <Trash2 size={12} />
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// Horarios de atención y de reservas, y días de cierre (solo el administrador). Lo que se guarda aquí rige de inmediato en
// el sitio: los horarios que ve el público, las horas que se pueden reservar y la fecha de entrega de las solvencias.
export default function HorariosPage() {
  const [horarios, setHorarios] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await adminApi.horarios();
      setHorarios(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar los horarios'));
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(seccion, semana) {
    const res = await adminApi.guardarHorarios({ [seccion]: semana });
    setHorarios(res.data.data);
  }

  if (!horarios) {
    return error ? (
      <AlertBanner>{error}</AlertBanner>
    ) : (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando horarios...
      </div>
    );
  }

  return (
    <PaginaAdmin descripcion="Los horarios que ve el público y que usa el sistema para aceptar reservas y calcular la entrega de las solvencias. Los cambios rigen de inmediato; las reservas que ya existen no se tocan.">
      <AlertBanner>{error}</AlertBanner>
      <EditorDeSemana
        titulo="Atención al público"
        descripcion="Cuándo está abierta la biblioteca. Con esto el sitio dice «Abierto ahora» o «Cerrado»."
        semana={horarios.atencion}
        onGuardar={(semana) => guardar('atencion', semana)}
      />
      <EditorDeSemana
        titulo="Reserva de cubículos y lugares de estudio"
        descripcion="Las horas en las que se pueden reservar. Solo se ofrecen horas enteras que caben completas dentro de un tramo: con un tramo de 13:10 a 19:15, la primera hora reservable es 14:00 y la última 18:00."
        semana={horarios.reservas}
        onGuardar={(semana) => guardar('reservas', semana)}
      />
      <DiasDeCierre cierres={horarios.cierres} onCambio={cargar} />
    </PaginaAdmin>
  );
}
