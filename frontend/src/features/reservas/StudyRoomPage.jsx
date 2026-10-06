import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { reservasApi } from './reservasApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import Modal from '../../shared/components/Modal';
import AlertBanner from '../../shared/components/AlertBanner';
import PageHeader from '../../shared/components/PageHeader';
import { Input } from '../../shared/components/FormField';
import CubiculoOpciones from './CubiculoOpciones';
import StudyRoomMap from './StudyRoomMap';
import { ZONAS } from './studyRoomLayout';
import { sumarHoras, ventanaDesde } from './reglasCubiculo';

const TIPOS = ZONAS.map((z) => z.tipo);

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StudyRoomPage() {
  const [zona, setZona] = useState(ZONAS[0].key);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState('');
  const [porTipo, setPorTipo] = useState({});
  const [reglas, setReglas] = useState(null);
  const [modalidad, setModalidad] = useState('fases');
  const [horasFases, setHorasFases] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [seleccion, setSeleccion] = useState(null); // { recursoId, nombre, tipo }
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [reservando, setReservando] = useState(false);
  const [errorReserva, setErrorReserva] = useState('');
  const [comprobante, setComprobante] = useState(null);

  const cargarDisponibilidad = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const respuestas = await Promise.all(TIPOS.map((tipo) => reservasApi.disponibilidad(tipo, fecha)));
      setPorTipo(Object.fromEntries(TIPOS.map((tipo, i) => [tipo, respuestas[i].data.data])));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la disponibilidad'));
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  useEffect(() => {
    reservasApi
      .reglas()
      .then((res) => setReglas(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar las reglas de los cubículos')));
  }, []);

  const horas = useMemo(() => (porTipo[TIPOS[0]]?.[0]?.franjas ?? []).map((f) => f.hora), [porTipo]);

  // Duración de la reserva de cubículo según el tipo elegido: fija o dentro del rango permitido.
  const reglaActual = reglas?.[modalidad] ?? null;
  const duracionCubiculo = reglaActual
    ? Math.min(Math.max(horasFases ?? reglaActual.minHoras, reglaActual.minHoras), reglaActual.maxHoras)
    : 1;
  const esCubiculos = zona === 'cubiculos';
  const duracionActiva = esCubiculos ? duracionCubiculo : 1;

  function horaPasada(h) {
    return fecha === hoyISO() && Number(h.slice(0, 2)) < new Date().getHours();
  }

  function horaValida(h) {
    return !horaPasada(h) && ventanaDesde(horas, h, duracionActiva).length === duracionActiva;
  }

  // Si la hora elegida ya pasó, o la reserva ya no cabe en el horario, se pasa a la primera hora posible.
  useEffect(() => {
    if (horas.length === 0) return;
    if (!hora || !horaValida(hora)) {
      setHora(horas.find(horaValida) ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horas, fecha, duracionActiva]);

  // Estado de cada lugar para la hora y la duración elegidas, por identificador.
  const estados = useMemo(() => {
    const mapa = {};
    Object.entries(porTipo).forEach(([tipo, recursos]) => {
      const duracion = tipo === 'cubiculo' ? duracionCubiculo : 1;
      const ventana = hora ? ventanaDesde(horas, hora, duracion) : [];
      const cabe = ventana.length === duracion;
      recursos.forEach((recurso) => {
        const aplica = tipo !== 'cubiculo' || (recurso.modalidades ?? []).includes(modalidad);
        const libre = aplica && cabe && ventana.every((h) => recurso.franjas.find((f) => f.hora === h)?.disponible);
        mapa[recurso.id] = { nombre: recurso.nombre, capacidad: recurso.capacidad, aplica, libre: Boolean(libre) };
      });
    });
    return mapa;
  }, [porTipo, hora, horas, modalidad, duracionCubiculo]);

  function resumenZona(z) {
    const recursos = (porTipo[z.tipo] ?? []).filter((r) => estados[r.id]?.aplica);
    return { libres: recursos.filter((r) => estados[r.id].libre).length, total: recursos.length };
  }

  const ventanaActiva = hora ? ventanaDesde(horas, hora, duracionActiva) : [];
  const horaFin = ventanaActiva.length === duracionActiva ? sumarHoras(ventanaActiva[ventanaActiva.length - 1], 1) : '';

  function elegirLugar(recursoId) {
    const tipo = ZONAS.find((z) => z.key === zona).tipo;
    setErrorReserva('');
    setSeleccion({ recursoId, nombre: estados[recursoId].nombre, tipo });
  }

  async function confirmarReserva(e) {
    e.preventDefault();
    setReservando(true);
    setErrorReserva('');
    const datos = { recursoId: seleccion.recursoId, fecha, hora, solicitante: nombre };
    if (seleccion.tipo === 'cubiculo') {
      Object.assign(datos, { identificacion: documento, modalidad, duracion: duracionCubiculo });
    }
    try {
      const res = await reservasApi.reservar(seleccion.tipo, datos);
      setComprobante(res.data.data);
      setNombre('');
      setDocumento('');
      setSeleccion(null);
    } catch (err) {
      setErrorReserva(getErrorMessage(err, 'No se pudo crear la reserva'));
    } finally {
      setReservando(false);
      cargarDisponibilidad();
    }
  }

  const esReservaCubiculo = seleccion?.tipo === 'cubiculo';

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ label: 'Inicio', to: '/' }, { label: 'Sala de estudio' }]}
        title="Sala de estudio"
        subtitle="Elige cubículos, estaciones o sala de lectura, selecciona fecha y hora, y toca un lugar libre en el plano para reservarlo."
      />

      <AlertBanner>{error}</AlertBanner>

      {comprobante ? <Comprobante reserva={comprobante} onCerrar={() => setComprobante(null)} /> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {ZONAS.map((z) => {
          const { libres, total } = resumenZona(z);
          const activa = zona === z.key;
          return (
            <button
              key={z.key}
              type="button"
              aria-pressed={activa}
              onClick={() => setZona(z.key)}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                activa ? 'border-primary bg-blue-50 shadow-sm ring-2 ring-primary/30' : 'border-border bg-white hover:border-primary'
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                  activa ? 'bg-primary text-white' : 'bg-surface text-primary'
                }`}
              >
                <z.icon size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-slate-900">{z.titulo}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{z.descripcion}</span>
                {total > 0 && hora ? (
                  <span className={`mt-1.5 block text-sm font-semibold ${libres === 0 ? 'text-action' : 'text-primary'}`}>
                    {libres} libres de {total}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="sm:w-52">
            <Input label="Fecha" type="date" value={fecha} min={hoyISO()} onChange={(e) => setFecha(e.target.value || hoyISO())} />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-[11px] font-semibold text-slate-500">Hora de inicio</p>
            <div className="flex flex-wrap gap-1.5">
              {horas.map((h) => {
                const pasada = horaPasada(h);
                const bloqueada = !horaValida(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={bloqueada}
                    title={pasada ? 'Esa hora ya pasó' : bloqueada ? 'La reserva no cabe en el horario desde esta hora' : undefined}
                    aria-pressed={hora === h}
                    onClick={() => setHora(h)}
                    className={`rounded-md px-3 py-2 font-mono text-sm transition-colors ${
                      hora === h
                        ? 'bg-primary font-semibold text-white shadow-sm'
                        : bloqueada
                          ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through'
                          : 'border border-border bg-white text-slate-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {esCubiculos ? (
          reglas ? (
            <CubiculoOpciones
              reglas={reglas}
              modalidad={modalidad}
              onModalidad={setModalidad}
              duracion={duracionCubiculo}
              onDuracion={setHorasFases}
            />
          ) : (
            <p className="border-t border-border pt-4 text-sm text-slate-500">Cargando las reglas de los cubículos...</p>
          )
        ) : null}
      </div>

      <section className="rounded-lg border border-border bg-white p-3 shadow-sm sm:p-4" aria-label="Plano de la sala de estudio">
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-primary" />
            Libre
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-action" />
            Ocupado
          </span>
          {esCubiculos ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-slate-400" />
              No aplica a este tipo de reserva
            </span>
          ) : null}
          <span className="text-slate-500">
            {horaFin
              ? `Disponibilidad de ${hora} a ${horaFin} del ${fecha}${duracionActiva > 1 ? ` (${duracionActiva} horas)` : ''}.`
              : 'No hay un horario posible hoy con esa duración: elige otra fecha.'}
          </span>
          {cargando ? <Loader2 className="animate-spin text-slate-400" size={16} /> : null}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <StudyRoomMap
              zona={zona}
              onZona={setZona}
              estados={horaFin ? estados : {}}
              seleccionId={seleccion?.recursoId}
              onSeleccionar={elegirLugar}
            />
          </div>
        </div>
      </section>

      <Modal
        open={!!seleccion}
        title="Confirmar reserva"
        onClose={() => setSeleccion(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSeleccion(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              form="form-reserva"
              type="submit"
              disabled={reservando || !nombre.trim() || (esReservaCubiculo && !documento.trim())}
            >
              {reservando ? 'Reservando...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        {seleccion ? (
          <form id="form-reserva" onSubmit={confirmarReserva} className="flex flex-col gap-3">
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{seleccion.nombre}</p>
              <p>
                {fecha} · <span className="font-mono">{hora}</span> a <span className="font-mono">{horaFin}</span>
                {duracionActiva > 1 ? ` (${duracionActiva} horas)` : ''}
              </p>
              {esReservaCubiculo && reglaActual ? <p>{reglaActual.nombre}</p> : null}
            </div>
            <AlertBanner>{errorReserva}</AlertBanner>
            <Input
              label="Nombre de quien reserva"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
            />
            {esReservaCubiculo ? (
              <Input
                label="Código o documento"
                required
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Código estudiantil o número de documento"
              />
            ) : null}
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function Comprobante({ reserva, onCerrar }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-blue-50 p-5">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <CheckCircle2 size={18} />
        <span className="text-base font-bold">Comprobante de reserva</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-slate-500">Código</dt>
        <dd className="font-mono font-semibold">{reserva.id}</dd>
        <dt className="text-slate-500">Lugar</dt>
        <dd>{reserva.recursoNombre}</dd>
        {reserva.modalidadNombre ? (
          <>
            <dt className="text-slate-500">Tipo de reserva</dt>
            <dd>{reserva.modalidadNombre}</dd>
          </>
        ) : null}
        <dt className="text-slate-500">Fecha y horario</dt>
        <dd>
          {reserva.fecha} · {reserva.hora} a {reserva.horaFin}
          {reserva.duracion > 1 ? ` (${reserva.duracion} horas)` : ''}
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
        Presenta este código {reserva.id} en el mostrador. El lugar queda apartado a tu nombre; el personal de biblioteca sella
        el ingreso y la salida en el comprobante físico.
      </p>
      <button onClick={onCerrar} className="mt-3 text-xs font-semibold text-primary hover:underline">
        Hacer otra reserva
      </button>
    </div>
  );
}
