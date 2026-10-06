import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { reservasApi } from './reservasApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import AlertBanner from '../../shared/components/AlertBanner';
import { Input } from '../../shared/components/FormField';

const TEXTOS = {
  cubiculo: {
    titulo: 'Reservar un cubículo',
    sub: 'Espacios cerrados para trabajo en grupo. Elige fecha, cubículo y hora disponible.',
  },
  espacio_estudio: {
    titulo: 'Reservar espacio de estudio',
    sub: 'Mesas individuales en la sala general. Elige fecha, mesa y hora disponible.',
  },
};

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReservationPage({ tipo }) {
  const [fecha, setFecha] = useState(hoyISO());
  const [recursos, setRecursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [seleccion, setSeleccion] = useState(null); // { recursoId, recursoNombre, hora }
  const [nombre, setNombre] = useState('');
  const [reservando, setReservando] = useState(false);
  const [comprobante, setComprobante] = useState(null);

  async function cargarDisponibilidad() {
    setCargando(true);
    setError('');
    try {
      const res = await reservasApi.disponibilidad(tipo, fecha);
      setRecursos(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la disponibilidad'));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDisponibilidad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, fecha]);

  async function confirmarReserva(e) {
    e.preventDefault();
    setReservando(true);
    setError('');
    try {
      const res = await reservasApi.reservar(tipo, {
        recursoId: seleccion.recursoId,
        fecha,
        hora: seleccion.hora,
        solicitante: nombre,
      });
      setComprobante(res.data.data);
      setSeleccion(null);
      setNombre('');
      cargarDisponibilidad();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la reserva'));
    } finally {
      setReservando(false);
    }
  }

  const texto = TEXTOS[tipo];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Reservas</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-primary-dark">{texto.titulo}</h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">{texto.sub}</p>
      </div>

      <div className="max-w-[220px]">
        <Input label="Fecha" type="date" value={fecha} min={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
      </div>

      <AlertBanner>{error}</AlertBanner>

      {comprobante ? <Comprobante tipo={tipo} reserva={comprobante} onCerrar={() => setComprobante(null)} /> : null}

      {cargando ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={18} />
          Cargando disponibilidad...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {recursos.map((recurso) => (
            <div key={recurso.id} className="rounded-xl border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-serif text-sm font-semibold text-primary-dark">{recurso.nombre}</h3>
                {recurso.capacidad ? <span className="text-xs text-slate-400">{recurso.capacidad} personas</span> : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recurso.franjas.map((f) => (
                  <button
                    key={f.hora}
                    disabled={!f.disponible}
                    onClick={() => setSeleccion({ recursoId: recurso.id, recursoNombre: recurso.nombre, hora: f.hora })}
                    className={`rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors ${
                      f.disponible
                        ? 'border border-border bg-surface text-slate-700 hover:border-accent hover:text-accent'
                        : 'cursor-not-allowed bg-slate-100 text-slate-300 line-through'
                    }`}
                  >
                    {f.hora}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!seleccion}
        title="Confirmar reserva"
        onClose={() => setSeleccion(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSeleccion(null)}>
              Cancelar
            </Button>
            <Button variant="primary" form="form-reserva" type="submit" disabled={reservando || !nombre.trim()}>
              {reservando ? 'Reservando...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        {seleccion ? (
          <form id="form-reserva" onSubmit={confirmarReserva} className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              {seleccion.recursoNombre} · {fecha} · <span className="font-mono">{seleccion.hora}</span>
            </p>
            <Input
              label="Nombre de quien reserva"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
            />
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function Comprobante({ tipo, reserva, onCerrar }) {
  return (
    <div className="rounded-xl border border-accent/40 bg-accent-light p-5">
      <div className="mb-3 flex items-center gap-2 text-accent">
        <CheckCircle2 size={18} />
        <span className="font-serif text-base font-semibold">Comprobante de reserva</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-slate-500">Código</dt>
        <dd className="font-mono font-semibold">{reserva.id}</dd>
        <dt className="text-slate-500">Recurso</dt>
        <dd>{reserva.recursoNombre}</dd>
        <dt className="text-slate-500">Fecha y hora</dt>
        <dd>
          {reserva.fecha} · {reserva.hora}
        </dd>
        <dt className="text-slate-500">A nombre de</dt>
        <dd>{reserva.solicitante}</dd>
        <dt className="text-slate-500">Estado</dt>
        <dd>
          <Badge tone="status" dot>
            Reservado
          </Badge>
        </dd>
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        Presenta este código {reserva.id} en el mostrador. {tipo === 'cubiculo' ? 'El cubículo' : 'La mesa'} queda apartado
        a tu nombre; el personal de biblioteca sella el ingreso y la salida en el comprobante físico.
      </p>
      <button onClick={onCerrar} className="mt-3 text-xs font-medium text-accent hover:underline">
        Hacer otra reserva
      </button>
    </div>
  );
}
