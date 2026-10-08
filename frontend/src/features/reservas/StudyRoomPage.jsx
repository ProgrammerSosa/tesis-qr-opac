import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarX, Clock, Info, Loader2 } from 'lucide-react';
import { reservasApi } from './reservasApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import Comprobante from '../../shared/components/Comprobante';
import Modal from '../../shared/components/Modal';
import Nota from '../../shared/components/Nota';
import Page from '../../shared/components/Page';
import { Input } from '../../shared/components/FormField';
import { fechaLarga, hoyISO, minutosDelDia, sumarDias, textoDeTramos } from '../../shared/utils/fechas';
import { correoValido } from '../../shared/utils/validaciones';
import RangoDeHoras from './RangoDeHoras';
import StudyRoomMap from './StudyRoomMap';
import { ZONAS } from './studyRoomLayout';
import { horasFinalesPosibles, sumarHoras, textoDeHoras, tramosOcupados } from './rangosDeHoras';

const TIPOS = ZONAS.map((z) => z.tipo);

// Cómo se nombra cada servicio en el aviso de pausa.
const NOMBRE_DEL_SERVICIO = { cubiculo: 'cubículos', estacion: 'estaciones', sala_lectura: 'la sala de lectura' };

export default function StudyRoomPage() {
  const { kiosco } = useKiosco();
  const [condiciones, setCondiciones] = useState(null);
  const [parametros] = useSearchParams();
  // /sala-de-estudio?zona=cubiculos | estaciones | sala abre directo en ese tipo de lugar.
  const zonaDeLaUrl = parametros.get('zona');
  const [zona, setZona] = useState(() => (ZONAS.some((z) => z.key === zonaDeLaUrl) ? zonaDeLaUrl : ZONAS[0].key));

  // Si ya estás en la sala y eliges otra opción del menú, la zona cambia con la dirección.
  useEffect(() => {
    if (ZONAS.some((z) => z.key === zonaDeLaUrl)) setZona(zonaDeLaUrl);
  }, [zonaDeLaUrl]);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState(''); // la hora de estaciones y sala de lectura (una hora); en los cubículos la persona elige `rango`
  const [porTipo, setPorTipo] = useState({});
  const [diaInfo, setDiaInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [seleccion, setSeleccion] = useState(null); // { recursoId, nombre, tipo }
  const [rango, setRango] = useState({ inicio: '', fin: '' }); // solo cubículos: de qué hora a qué hora
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [correo, setCorreo] = useState('');
  const [reservando, setReservando] = useState(false);
  const [errorReserva, setErrorReserva] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const encabezadoComprobante = useRef(null);

  const hoy = hoyISO();
  const diasMaximos = condiciones?.diasMaximosDeAnticipacion ?? 30;
  const tolerancia = condiciones?.toleranciaMinutos ?? 15;
  const maxHorasPorReserva = condiciones?.cubiculo?.maxHorasPorReserva ?? 8;
  const maxHorasPorDia = condiciones?.cubiculo?.maxHorasPorDia ?? 8;

  const cargarDisponibilidad = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [respuestas, dia] = await Promise.all([
        Promise.all(TIPOS.map((tipo) => reservasApi.disponibilidad(tipo, fecha))),
        reservasApi.diaDeHorario(fecha),
      ]);
      setPorTipo(Object.fromEntries(TIPOS.map((tipo, i) => [tipo, respuestas[i].data.data])));
      setDiaInfo(dia.data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la disponibilidad'));
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  // Las condiciones generales son informativas: si no llegan, la pantalla funciona igual con valores por defecto.
  useEffect(() => {
    reservasApi
      .condiciones()
      .then((res) => setCondiciones(res.data.data))
      .catch(() => setCondiciones(null));
  }, []);

  // Las horas en las que se puede reservar ese día (pueden tener huecos, como la pausa del mediodía).
  const horas = useMemo(() => (porTipo[TIPOS[0]]?.[0]?.franjas ?? []).map((f) => f.hora), [porTipo]);
  const cubiculos = useMemo(() => porTipo.cubiculo ?? [], [porTipo]);
  const esCubiculos = zona === 'cubiculos';

  // La biblioteca puede pausar las reservas de un tipo de lugar (se configura en el panel del personal).
  const estaPausada = (z) => Boolean(condiciones?.pausadas?.includes(z.tipo));
  const zonaActual = ZONAS.find((z) => z.key === zona);
  const zonaPausada = estaPausada(zonaActual);
  const diaCerrado = Boolean(diaInfo?.cerrado);

  // Una hora ya no se puede reservar cuando pasó su tiempo de tolerancia (después de eso la reserva se liberaría sola).
  const horaPasada = useCallback((h) => fecha === hoy && minutosDelDia() >= Number(h.slice(0, 2)) * 60 + tolerancia, [fecha, hoy, tolerancia]);

  // Cómo está una hora de un lugar: libre, ocupada (ya reservada) o pasada (ya no se puede reservar).
  const estadoDeHora = useCallback(
    (recurso, h) => {
      if (!recurso.franjas.find((f) => f.hora === h)?.disponible) return 'ocupada';
      return horaPasada(h) ? 'pasada' : 'libre';
    },
    [horaPasada]
  );

  // Si la hora elegida ya pasó, se pasa a la primera hora posible (estaciones y sala de lectura).
  useEffect(() => {
    if (horas.length === 0) {
      if (hora) setHora('');
      return;
    }
    if (!hora || !horas.includes(hora) || horaPasada(hora)) {
      setHora(horas.find((h) => !horaPasada(h)) ?? '');
    }
  }, [horas, hora, horaPasada]);

  // Estado de cada lugar, por identificador. Estaciones y sala: libres a la hora elegida. Cubículos: libres si les queda alguna hora ese día
  // (las horas se eligen al reservar y allí se avisa si ya están reservadas).
  const estados = useMemo(() => {
    const mapa = {};
    Object.entries(porTipo).forEach(([tipo, recursos]) => {
      recursos.forEach((recurso) => {
        const libre =
          tipo === 'cubiculo'
            ? horas.some((h) => estadoDeHora(recurso, h) === 'libre')
            : Boolean(hora) && horas.includes(hora) && recurso.franjas.find((f) => f.hora === hora)?.disponible;
        mapa[recurso.id] = {
          nombre: recurso.nombre,
          capacidad: recurso.capacidad,
          libre: Boolean(libre),
          ...(tipo === 'cubiculo' ? { resumen: libre ? 'Con horas libres' : 'Sin horas libres' } : {}),
        };
      });
    });
    return mapa;
  }, [porTipo, hora, horas, estadoDeHora]);

  function resumenZona(z) {
    const recursos = porTipo[z.tipo] ?? [];
    return { libres: recursos.filter((r) => estados[r.id]?.libre).length, total: recursos.length };
  }

  const horaFin = hora && horas.includes(hora) ? sumarHoras(hora, 1) : '';

  // Con qué horas se abre la reserva de un cubículo: la primera hora libre; si ya no le queda ninguna, la primera que no ha pasado
  // (y allí se le avisa a la persona que está reservado).
  const rangoInicial = useCallback(
    (recurso) => {
      const inicio = horas.find((h) => estadoDeHora(recurso, h) === 'libre') ?? horas.find((h) => !horaPasada(h));
      return inicio ? { inicio, fin: sumarHoras(inicio, 1) } : { inicio: '', fin: '' };
    },
    [horas, estadoDeHora, horaPasada]
  );

  const esReservaCubiculo = seleccion?.tipo === 'cubiculo';
  const cubiculoElegido = esReservaCubiculo ? cubiculos.find((r) => r.id === seleccion.recursoId) : null;
  const ocupadaElegido = useCallback((h) => (cubiculoElegido ? estadoDeHora(cubiculoElegido, h) === 'ocupada' : false), [cubiculoElegido, estadoDeHora]);
  const iniciosPosibles = horas.filter((h) => !horaPasada(h));
  const finalesPosibles = rango.inicio ? horasFinalesPosibles(horas, rango.inicio, maxHorasPorReserva) : [];
  const rangoEnLista = iniciosPosibles.includes(rango.inicio) && finalesPosibles.includes(rango.fin);
  // Las horas elegidas que ya están reservadas en ese cubículo: si hay alguna, no se puede confirmar.
  const choques = rangoEnLista ? tramosOcupados(horas, ocupadaElegido, rango.inicio, rango.fin) : [];
  const todoElDiaReservado = iniciosPosibles.length > 0 && iniciosPosibles.every(ocupadaElegido);
  const rangoValido = rangoEnLista && choques.length === 0;

  // Si mientras la reserva está abierta cambian las horas (pasó una hora, o se recargó la disponibilidad), se corrigen las horas
  // elegidas; si ya no queda ninguna hora en el día, se cierra la reserva y se avisa.
  useEffect(() => {
    if (!cubiculoElegido || rangoEnLista) return;
    const nuevo = rangoInicial(cubiculoElegido);
    if (nuevo.inicio) {
      setRango(nuevo);
    } else {
      setSeleccion(null);
      setError('Ya no quedan horas para reservar ese día. Elige otra fecha.');
    }
  }, [cubiculoElegido, rangoEnLista, rangoInicial]);

  function elegirLugar(recursoId) {
    const tipo = ZONAS.find((z) => z.key === zona).tipo;
    setErrorReserva('');
    if (tipo === 'cubiculo') {
      const inicial = rangoInicial(cubiculos.find((r) => r.id === recursoId));
      if (!inicial.inicio) {
        setError('Ya no quedan horas para reservar ese día. Elige otra fecha.');
        return;
      }
      setRango(inicial);
    }
    setSeleccion({ recursoId, nombre: estados[recursoId].nombre, tipo });
  }

  async function confirmarReserva(e) {
    e.preventDefault();
    if (correo.trim() && !correoValido(correo)) {
      setErrorReserva('El correo no parece válido. Revísalo o déjalo en blanco.');
      return;
    }
    setReservando(true);
    setErrorReserva('');
    const datos = {
      recursoId: seleccion.recursoId,
      fecha,
      hora: esReservaCubiculo ? rango.inicio : hora,
      solicitante: nombre,
      identificacion: documento,
      correo,
      kiosco,
    };
    if (esReservaCubiculo) datos.horaFin = rango.fin;
    try {
      const res = await reservasApi.reservar(seleccion.tipo, datos);
      setComprobante(res.data.data);
      setNombre('');
      setDocumento('');
      setCorreo('');
      setSeleccion(null);
      setTimeout(() => encabezadoComprobante.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      setErrorReserva(getErrorMessage(err, 'No se pudo crear la reserva'));
    } finally {
      setReservando(false);
      cargarDisponibilidad();
    }
  }

  const lineaDeHorario =
    diaInfo?.ventanasDeReserva?.length > 0 ? (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Clock size={13} aria-hidden="true" />
        Horario de reservas de ese día: {textoDeTramos(diaInfo.ventanasDeReserva)}
      </p>
    ) : null;

  const planConEstados = (esCubiculos || horaFin) && !zonaPausada && !diaCerrado;

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Reservar espacio de estudio' }]}
      title="Reservar espacio de estudio"
      subtitle="Elige el tipo de lugar (cubículos, estaciones o sala de lectura), la fecha y toca un lugar en el plano. En los cubículos escribes de qué hora a qué hora; en estaciones y sala de lectura se reserva una hora."
    >
      <div className="flex flex-col gap-6">
        <AlertBanner>{error}</AlertBanner>

        {comprobante ? (
          <div ref={encabezadoComprobante} className="scroll-mt-28">
            <Comprobante
              tipo="reserva"
              registro={comprobante}
              toleranciaMinutos={tolerancia}
              textoNueva="Hacer otra reserva"
              onNueva={() => setComprobante(null)}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ZONAS.map((z) => {
            const { libres, total } = resumenZona(z);
            const activa = zona === z.key;
            const esZonaDeCubiculos = z.tipo === 'cubiculo';
            return (
              <button
                key={z.key}
                type="button"
                aria-pressed={activa}
                onClick={() => setZona(z.key)}
                className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition-all ${
                  activa ? 'border-primary bg-blue-50 shadow-card ring-2 ring-primary/30' : 'border-border bg-white hover:border-primary hover:shadow-card'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    activa ? 'bg-primary text-white' : 'bg-surface text-primary'
                  }`}
                >
                  <z.icon size={24} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-slate-900">{z.titulo}</span>
                  <span className="mt-0.5 block text-sm text-slate-600">{z.descripcion}</span>
                  {estaPausada(z) ? (
                    <span className="mt-2 block text-sm font-semibold text-amber-700">Pausado temporalmente</span>
                  ) : total > 0 && (esZonaDeCubiculos || hora) && !diaCerrado ? (
                    <span className={`mt-2 block text-sm font-bold ${libres === 0 ? 'text-action' : 'text-primary'}`}>
                      {esZonaDeCubiculos ? `${libres} con horas libres de ${total}` : `${libres} libres de ${total}`}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {zonaPausada ? (
          <Nota tono="aviso">
            Las reservas de {NOMBRE_DEL_SERVICIO[zonaActual.tipo]} están pausadas temporalmente. Consulta en el mostrador de la biblioteca.
          </Nota>
        ) : null}

        <div className="flex gap-3 rounded-2xl border border-border bg-surface p-5 text-sm text-slate-700">
          <Info size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-bold text-slate-900">Condiciones de uso</p>
            <ul className="mt-1.5 grid list-disc gap-x-8 gap-y-1 pl-5 md:grid-cols-2">
              <li>
                Cubículos: escribes de qué hora a qué hora, hasta {textoDeHoras(maxHorasPorReserva)} por reserva y {textoDeHoras(maxHorasPorDia)} al día
                por persona. Estaciones y sillas de la sala: 1 hora.
              </li>
              <li>Para reservar necesitas tu carné, tu correo institucional o tu documento.</li>
              <li>
                Si no te presentas dentro de {tolerancia} minutos del inicio, la reserva se libera y el lugar queda disponible para otra persona.
              </li>
              <li>Puedes reservar hasta {diasMaximos} días adelante. Al terminar recibes un comprobante: imprímelo o envíalo a tu correo.</li>
            </ul>
          </div>
        </div>

        <div className="campos-grandes flex flex-col gap-5 rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="sm:w-60">
              <Input
                label="Fecha"
                type="date"
                value={fecha}
                min={hoy}
                max={sumarDias(hoy, diasMaximos)}
                onChange={(e) => setFecha(e.target.value || hoy)}
                hint={fechaLarga(fecha)}
              />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[13px] font-semibold text-slate-500">{esCubiculos ? 'Horas' : 'Hora de inicio'}</p>
              {diaCerrado ? (
                <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  <CalendarX size={18} aria-hidden="true" />
                  Ese día la biblioteca está cerrada.
                </p>
              ) : horas.length === 0 ? (
                <p className="rounded-lg bg-surface px-4 py-3 text-sm text-slate-600">
                  {cargando ? 'Cargando los horarios...' : 'No hay horario de reservas ese día. Elige otra fecha.'}
                </p>
              ) : esCubiculos ? (
                <>
                  <p className="rounded-lg bg-surface px-4 py-3 text-sm leading-relaxed text-slate-700">
                    Toca un cubículo en el plano y escribe <b>de qué hora a qué hora</b> lo necesitas. Si ya está reservado, te avisamos para que elijas
                    otro cubículo o cambies la hora.
                  </p>
                  {lineaDeHorario}
                </>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {horas.map((h) => {
                      const pasada = horaPasada(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={pasada}
                          title={pasada ? 'Esa hora ya pasó' : undefined}
                          aria-pressed={hora === h}
                          onClick={() => setHora(h)}
                          className={`min-h-11 rounded-lg px-4 py-2 font-mono text-sm transition-colors ${
                            hora === h
                              ? 'bg-primary font-semibold text-white shadow-sm'
                              : pasada
                                ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through'
                                : 'border border-border bg-white text-slate-700 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                  {lineaDeHorario}
                </>
              )}
            </div>
          </div>

          {diaCerrado ? (
            <Nota tono="aviso" titulo="Cerrado ese día">
              {diaInfo.motivo ? `${diaInfo.motivo}. ` : ''}No hay atención ni reservas el {fechaLarga(fecha)}. Elige otra fecha.
            </Nota>
          ) : null}
        </div>

        <section className="rounded-2xl border border-border bg-white p-3 shadow-card sm:p-5" aria-label="Plano de la sala de estudio">
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-primary" />
              Libre
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-action" />
              {esCubiculos ? 'Sin horas libres' : 'Ocupado'}
            </span>
            <span className="text-slate-500">
              {diaCerrado
                ? 'La biblioteca está cerrada ese día.'
                : zonaPausada
                  ? 'Las reservas de este tipo de lugar están pausadas.'
                  : esCubiculos
                    ? 'Toca un cubículo para elegir de qué hora a qué hora.'
                    : horaFin
                      ? `Disponibilidad de ${hora} a ${horaFin} del ${fecha}.`
                      : 'No hay una hora posible ese día: elige otra fecha.'}
            </span>
            {cargando ? <Loader2 className="animate-spin text-slate-400" size={16} aria-label="Cargando" /> : null}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <StudyRoomMap
                zona={zona}
                onZona={setZona}
                estados={planConEstados ? estados : {}}
                seleccionId={seleccion?.recursoId}
                onSeleccionar={elegirLugar}
              />
            </div>
          </div>
        </section>
      </div>

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
              disabled={reservando || !nombre.trim() || !documento.trim() || (esReservaCubiculo && !rangoValido)}
            >
              {reservando ? 'Reservando...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        {seleccion ? (
          <form id="form-reserva" onSubmit={confirmarReserva} className="campos-grandes flex flex-col gap-3">
            <div className="rounded-lg bg-surface px-4 py-3 text-sm text-slate-600">
              <p className="font-bold text-slate-900">
                {seleccion.nombre}
                {esReservaCubiculo && cubiculoElegido?.capacidad ? <span className="font-normal text-slate-500"> · hasta {cubiculoElegido.capacidad} personas</span> : null}
              </p>
              <p>
                {fechaLarga(fecha)}
                {!esReservaCubiculo ? (
                  <>
                    {' '}
                    · <span className="font-mono">{hora}</span> a <span className="font-mono">{horaFin}</span>
                  </>
                ) : null}
              </p>
            </div>

            {esReservaCubiculo ? (
              <div className="flex flex-col gap-2 border-b border-border pb-4">
                <p className="text-sm font-bold text-slate-900">¿De qué hora a qué hora?</p>
                <RangoDeHoras
                  horas={horas}
                  pasada={horaPasada}
                  inicio={rango.inicio}
                  fin={rango.fin}
                  maxHoras={maxHorasPorReserva}
                  choques={choques}
                  todoElDiaReservado={todoElDiaReservado}
                  onCambiar={setRango}
                />
              </div>
            ) : null}

            {/* Si el aviso de «ya está reservado» ya se ve junto a las horas, no se repite el mismo mensaje del servidor. */}
            {esReservaCubiculo && (choques.length > 0 || todoElDiaReservado) ? null : <AlertBanner>{errorReserva}</AlertBanner>}
            <Input
              label="Nombre de quien reserva"
              required
              autoFocus={!esReservaCubiculo}
              autoComplete="name"
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
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            <p className="text-xs text-slate-500">Solo se guardan los datos necesarios para la reserva. Al terminar, la pantalla se limpia.</p>
          </form>
        ) : null}
      </Modal>
    </Page>
  );
}
