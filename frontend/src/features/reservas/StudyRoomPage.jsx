import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { reservasApi } from './reservasApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import Button from '../../shared/components/Button';
import Comprobante from '../../shared/components/Comprobante';
import Modal from '../../shared/components/Modal';
import AlertBanner from '../../shared/components/AlertBanner';
import PageHeader from '../../shared/components/PageHeader';
import { Input } from '../../shared/components/FormField';
import CubiculoOpciones from './CubiculoOpciones';
import StudyRoomMap from './StudyRoomMap';
import { ZONAS } from './studyRoomLayout';
import { sumarHoras, ventanaDesde } from './reglasCubiculo';

const TIPOS = ZONAS.map((z) => z.tipo);

// Cómo se nombra cada servicio en el aviso de pausa.
const NOMBRE_DEL_SERVICIO = { cubiculo: 'cubículos', estacion: 'estaciones', sala_lectura: 'la sala de lectura' };

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StudyRoomPage() {
  const { kiosco } = useKiosco();
  const [condiciones, setCondiciones] = useState(null);
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
  const [correo, setCorreo] = useState('');
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
    // Las condiciones generales son informativas: si no llegan, la pantalla funciona igual sin mostrarlas.
    reservasApi
      .condiciones()
      .then((res) => setCondiciones(res.data.data))
      .catch(() => setCondiciones(null));
  }, []);

  const horas = useMemo(() => (porTipo[TIPOS[0]]?.[0]?.franjas ?? []).map((f) => f.hora), [porTipo]);

  // Duración de la reserva de cubículo según el tipo elegido: fija o dentro del rango permitido.
  const reglaActual = reglas?.[modalidad] ?? null;
  const duracionCubiculo = reglaActual
    ? Math.min(Math.max(horasFases ?? reglaActual.minHoras, reglaActual.minHoras), reglaActual.maxHoras)
    : 1;
  const esCubiculos = zona === 'cubiculos';
  const duracionActiva = esCubiculos ? duracionCubiculo : 1;

  // La biblioteca puede pausar las reservas de un tipo de lugar (se configura en el panel del personal).
  const estaPausada = (z) => Boolean(condiciones?.pausadas?.includes(z.tipo));
  const zonaActual = ZONAS.find((z) => z.key === zona);
  const zonaPausada = estaPausada(zonaActual);

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
    const datos = { recursoId: seleccion.recursoId, fecha, hora, solicitante: nombre, identificacion: documento, correo, kiosco };
    if (seleccion.tipo === 'cubiculo') {
      Object.assign(datos, { modalidad, duracion: duracionCubiculo });
    }
    try {
      const res = await reservasApi.reservar(seleccion.tipo, datos);
      setComprobante(res.data.data);
      setNombre('');
      setDocumento('');
      setCorreo('');
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

      {comprobante ? (
        <Comprobante
          tipo="reserva"
          registro={comprobante}
          toleranciaMinutos={condiciones?.toleranciaMinutos}
          textoNueva="Hacer otra reserva"
          onNueva={() => setComprobante(null)}
        />
      ) : null}

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
                {estaPausada(z) ? (
                  <span className="mt-1.5 block text-sm font-semibold text-amber-700">Pausado temporalmente</span>
                ) : total > 0 && hora ? (
                  <span className={`mt-1.5 block text-sm font-semibold ${libres === 0 ? 'text-action' : 'text-primary'}`}>
                    {libres} libres de {total}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {zonaPausada ? (
        <div role="status" className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Las reservas de {NOMBRE_DEL_SERVICIO[zonaActual.tipo]} están pausadas temporalmente. Consulta en el mostrador de la
            biblioteca.
          </span>
        </div>
      ) : null}

      <div className="flex gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-slate-700">
        <Info size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="font-bold text-slate-900">Condiciones de uso</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>Duración permitida: cubículos según el tipo de reserva (más abajo); estaciones y sillas de la sala, 1 hora.</li>
            <li>Para reservar necesitas tu carné, tu correo institucional o tu documento.</li>
            {condiciones ? (
              <li>
                Si no te presentas dentro de {condiciones.toleranciaMinutos} minutos del inicio, la reserva se libera y el
                lugar queda disponible para otra persona.
              </li>
            ) : null}
            <li>Al terminar recibes un comprobante: puedes imprimirlo o enviarlo a tu correo.</li>
          </ul>
        </div>
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
            {zonaPausada
              ? 'Las reservas de este tipo de lugar están pausadas.'
              : horaFin
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
              estados={horaFin && !zonaPausada ? estados : {}}
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
              disabled={reservando || !nombre.trim() || !documento.trim()}
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
            <Input
              label="Carné, correo institucional o documento"
              required
              hint="Con este dato se identifica tu reserva."
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Por ejemplo, tu número de carné"
            />
            <Input
              label="Correo para el comprobante (opcional)"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            <p className="text-xs text-slate-500">
              Solo se guardan los datos necesarios para la reserva. Al terminar, la pantalla se limpia.
            </p>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
