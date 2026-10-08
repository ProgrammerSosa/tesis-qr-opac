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
import CubiculoOpciones from './CubiculoOpciones';
import StudyRoomMap from './StudyRoomMap';
import { ZONAS } from './studyRoomLayout';
import { sumarHoras, ventanaDesde } from './reglasCubiculo';

const TIPOS = ZONAS.map((z) => z.tipo);

// Cómo se nombra cada servicio en el aviso de pausa.
const NOMBRE_DEL_SERVICIO = { cubiculo: 'cubículos', estacion: 'estaciones', sala_lectura: 'la sala de lectura' };

export default function StudyRoomPage() {
  const { kiosco } = useKiosco();
  const [condiciones, setCondiciones] = useState(null);
  const [parametros] = useSearchParams();
  // /sala-de-estudio?zona=cubiculos | estaciones | sala abre directo en ese tipo de lugar (las opciones del menú inicial).
  const zonaDeLaUrl = parametros.get('zona');
  const [zona, setZona] = useState(() => (ZONAS.some((z) => z.key === zonaDeLaUrl) ? zonaDeLaUrl : ZONAS[0].key));

  // Si ya estás en la sala y eliges otra opción del menú, la zona cambia con la dirección.
  useEffect(() => {
    if (ZONAS.some((z) => z.key === zonaDeLaUrl)) setZona(zonaDeLaUrl);
  }, [zonaDeLaUrl]);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState('');
  const [porTipo, setPorTipo] = useState({});
  const [diaInfo, setDiaInfo] = useState(null);
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
  const encabezadoComprobante = useRef(null);

  const hoy = hoyISO();
  const diasMaximos = condiciones?.diasMaximosDeAnticipacion ?? 30;
  const tolerancia = condiciones?.toleranciaMinutos ?? 15;

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

  useEffect(() => {
    reservasApi
      .reglas()
      .then((res) => setReglas(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar las reglas de los cubículos')));
    // Las condiciones generales son informativas: si no llegan, la pantalla funciona igual con valores por defecto.
    reservasApi
      .condiciones()
      .then((res) => setCondiciones(res.data.data))
      .catch(() => setCondiciones(null));
  }, []);

  // Las horas en las que se puede reservar ese día (pueden tener huecos, como la pausa del mediodía).
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
  const diaCerrado = Boolean(diaInfo?.cerrado);

  // Una hora ya no se puede reservar cuando pasó su tiempo de tolerancia (después de eso la reserva se liberaría sola).
  function horaPasada(h) {
    return fecha === hoy && minutosDelDia() >= Number(h.slice(0, 2)) * 60 + tolerancia;
  }

  function horaValida(h) {
    return !horaPasada(h) && ventanaDesde(horas, h, duracionActiva).length === duracionActiva;
  }

  // Si la hora elegida ya pasó, o la reserva ya no cabe en el horario, se pasa a la primera hora posible.
  useEffect(() => {
    if (horas.length === 0) {
      if (hora) setHora('');
      return;
    }
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
    if (correo.trim() && !correoValido(correo)) {
      setErrorReserva('El correo no parece válido. Revísalo o déjalo en blanco.');
      return;
    }
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
      setTimeout(() => encabezadoComprobante.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      setErrorReserva(getErrorMessage(err, 'No se pudo crear la reserva'));
    } finally {
      setReservando(false);
      cargarDisponibilidad();
    }
  }

  const esReservaCubiculo = seleccion?.tipo === 'cubiculo';

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Sala de estudio' }]}
      title="Sala de estudio"
      subtitle="Elige cubículos, estaciones o sala de lectura, selecciona fecha y hora, y toca un lugar libre en el plano para reservarlo."
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
                  ) : total > 0 && hora && !diaCerrado ? (
                    <span className={`mt-2 block text-sm font-bold ${libres === 0 ? 'text-action' : 'text-primary'}`}>
                      {libres} libres de {total}
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
              <li>Cubículos: la duración depende del tipo de reserva (más abajo). Estaciones y sillas de la sala: 1 hora.</li>
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
              <p className="mb-1 text-[13px] font-semibold text-slate-500">Hora de inicio</p>
              {diaCerrado ? (
                <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  <CalendarX size={18} aria-hidden="true" />
                  Ese día la biblioteca está cerrada.
                </p>
              ) : horas.length === 0 ? (
                <p className="rounded-lg bg-surface px-4 py-3 text-sm text-slate-600">
                  {cargando ? 'Cargando los horarios...' : 'No hay horario de reservas ese día. Elige otra fecha.'}
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
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
                          className={`min-h-11 rounded-lg px-4 py-2 font-mono text-sm transition-colors ${
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
                  {diaInfo?.ventanasDeReserva?.length > 0 ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={13} aria-hidden="true" />
                      Horario de reservas de ese día: {textoDeTramos(diaInfo.ventanasDeReserva)}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {diaCerrado ? (
            <Nota tono="aviso" titulo="Cerrado ese día">
              {diaInfo.motivo ? `${diaInfo.motivo}. ` : ''}No hay atención ni reservas el {fechaLarga(fecha)}. Elige otra fecha.
            </Nota>
          ) : null}

          {esCubiculos && !diaCerrado ? (
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

        <section className="rounded-2xl border border-border bg-white p-3 shadow-card sm:p-5" aria-label="Plano de la sala de estudio">
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
              {diaCerrado
                ? 'La biblioteca está cerrada ese día.'
                : zonaPausada
                  ? 'Las reservas de este tipo de lugar están pausadas.'
                  : horaFin
                    ? `Disponibilidad de ${hora} a ${horaFin} del ${fecha}${duracionActiva > 1 ? ` (${duracionActiva} horas)` : ''}.`
                    : 'No hay un horario posible ese día con esa duración: elige otra fecha u otra hora.'}
            </span>
            {cargando ? <Loader2 className="animate-spin text-slate-400" size={16} aria-label="Cargando" /> : null}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <StudyRoomMap
                zona={zona}
                onZona={setZona}
                estados={horaFin && !zonaPausada && !diaCerrado ? estados : {}}
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
            <Button variant="primary" form="form-reserva" type="submit" disabled={reservando || !nombre.trim() || !documento.trim()}>
              {reservando ? 'Reservando...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        {seleccion ? (
          <form id="form-reserva" onSubmit={confirmarReserva} className="campos-grandes flex flex-col gap-3">
            <div className="rounded-lg bg-surface px-4 py-3 text-sm text-slate-600">
              <p className="font-bold text-slate-900">{seleccion.nombre}</p>
              <p>
                {fechaLarga(fecha)} · <span className="font-mono">{hora}</span> a <span className="font-mono">{horaFin}</span>
                {duracionActiva > 1 ? ` (${duracionActiva} horas)` : ''}
              </p>
              {esReservaCubiculo && reglaActual ? <p>{reglaActual.nombre}</p> : null}
            </div>
            <AlertBanner>{errorReserva}</AlertBanner>
            <Input
              label="Nombre de quien reserva"
              required
              autoFocus
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
