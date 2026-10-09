import { useCallback, useEffect, useMemo, useState } from 'react';
import { Armchair, DoorClosed, Loader2, MonitorSmartphone, RefreshCw } from 'lucide-react';
import { adminApi } from '../adminApi';
import { reservasApi } from '../../reservas/reservasApi';
import { usePaginaLocal } from '../usePaginaLocal';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Nota from '../../../shared/components/Nota';
import Paginacion from '../../../shared/components/Paginacion';
import { fechaCorta, fechaYHora } from '../../../shared/utils/fechas';
import AccionesDeReserva from '../componentes/AccionesDeReserva';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import LugarDeReserva from '../componentes/LugarDeReserva';
import ModalConfirmar from '../componentes/ModalConfirmar';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ESTADO_RESERVA, MOTIVO_LIBERACION, TIPO_RESERVA } from '../estados';
import { horasQueSeLiberan, relojDeLaBiblioteca, situacionDeHoy, textoDeDuracion } from '../reservasDelPanel';

const TIPOS = ['cubiculo', 'estacion', 'sala_lectura'];
const TIPO_EN_PLURAL = { cubiculo: 'Cubículos', estacion: 'Estaciones', sala_lectura: 'Sala de lectura' };
const ICONO_DEL_TIPO = { cubiculo: DoorClosed, estacion: MonitorSmartphone, sala_lectura: Armchair };
const ALCANCES = [
  ['hoy', 'Hoy'],
  ['proximas', 'Próximas'],
  ['pasadas', 'Anteriores'],
  ['todas', 'Todas'],
];
const CADA_CUANTO_MS = 30 * 1000;
const MAXIMO_POR_LLEGAR = 8;

const ACCION_DE_LA_API = {
  ingreso: reservasApi.avanzar,
  salida: reservasApi.avanzar,
  liberar: reservasApi.liberar,
  cancelar: reservasApi.cancelar,
};

// Cuánto lugar queda de cada tipo, ahora mismo.
function OcupacionDeLugares({ tipo, datos }) {
  const Icono = ICONO_DEL_TIPO[tipo];
  const ocupados = datos.enUso + datos.esperando;
  const libres = datos.total - ocupados;
  const porcentaje = (cantidad) => (datos.total ? (cantidad / datos.total) * 100 : 0);
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icono size={16} className="text-primary" aria-hidden="true" />
        {TIPO_EN_PLURAL[tipo]}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="font-heading text-3xl font-semibold leading-none text-primary-dark">{ocupados}</span>
        <span className="text-sm text-slate-500">de {datos.total} ocupados</span>
      </p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${datos.enUso} en uso, ${datos.esperando} esperando, ${libres} libres`}>
        <span className="bg-primary" style={{ width: `${porcentaje(datos.enUso)}%` }} />
        <span className="bg-amber-400" style={{ width: `${porcentaje(datos.esperando)}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {datos.enUso} en uso · {datos.esperando} esperando · {libres} libres
      </p>
    </div>
  );
}

function GrupoDeAtencion({ titulo, color, cantidad, vacio, children }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />
        {titulo}
        <span className="text-xs font-semibold text-slate-400">{cantidad}</span>
      </h3>
      {cantidad === 0 ? <p className="mt-1.5 text-sm text-slate-400">{vacio}</p> : <ul className="mt-1 divide-y divide-border">{children}</ul>}
    </div>
  );
}

function FilaDeAtencion({ reserva, detalle, children }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="w-52 min-w-0 shrink-0">
        <LugarDeReserva reserva={reserva} />
      </div>
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-sm font-semibold text-slate-900">{reserva.solicitante}</p>
        <p className="text-xs text-slate-500">
          <span className="font-mono text-slate-700">
            {reserva.hora}–{reserva.horaFin}
          </span>{' '}
          · {detalle}
        </p>
      </div>
      {children}
    </li>
  );
}

// Lo que el texto de la ventana de confirmación dice de cada acción.
function ContenidoDeConfirmacion({ tipo, reserva, reloj }) {
  const lugar = <b>{reserva.recursoNombre}</b>;
  const persona = <b>{reserva.solicitante}</b>;
  const aviso = reserva.correo ? <p>Le avisaremos por correo a {reserva.correo}.</p> : null;
  if (tipo === 'liberar') {
    return (
      <>
        <p>
          {lugar} está reservado por {persona} de {reserva.hora} a {reserva.horaFin}. Si no llegó, o avisó que no vendrá, el lugar queda libre ahora mismo para que otra
          persona lo reserve.
        </p>
        {aviso}
      </>
    );
  }
  if (tipo === 'cancelar') {
    return (
      <>
        <p>
          Se cancelará la reserva <b>{reserva.id}</b> de {persona} en {lugar} ({fechaCorta(reserva.fecha)}, de {reserva.hora} a {reserva.horaFin}). Esto no se puede deshacer y
          el lugar queda libre.
        </p>
        {aviso}
      </>
    );
  }
  const liberadas = horasQueSeLiberan(reserva, reloj);
  return liberadas ? (
    <p>
      {persona} se va antes de que termine su reserva (a las {reserva.horaFin}). Al registrar su salida, {lugar} queda libre de <b>{liberadas.desde}</b> a <b>{liberadas.hasta}</b>{' '}
      y otras personas podrán reservar esas horas.
    </p>
  ) : (
    <p>
      Se registra la salida de {persona} de {lugar}. La reserva queda finalizada.
    </p>
  );
}

const TEXTOS_DE_CONFIRMACION = {
  liberar: { titulo: '¿Liberar este lugar?', boton: 'Sí, liberar el lugar', volver: 'No, dejarlo', peligro: true },
  cancelar: { titulo: '¿Cancelar la reserva?', boton: 'Sí, cancelar la reserva', volver: 'No, mantenerla', peligro: true },
  salida: { titulo: '¿Registrar la salida?', boton: 'Sí, registrar la salida', volver: 'Volver', peligro: false },
};

function avisoDeResultado(tipo, reserva) {
  if (tipo === 'ingreso') return `Ingreso registrado: ${reserva.solicitante} ya está en ${reserva.recursoNombre}.`;
  if (tipo === 'salida') {
    return reserva.salioAntes
      ? `Salida registrada. ${reserva.recursoNombre} quedó libre de ${reserva.horaFin} a ${reserva.horaFinOriginal}.`
      : `Salida registrada: la reserva de ${reserva.recursoNombre} quedó finalizada.`;
  }
  if (tipo === 'liberar') return `Lugar liberado: ${reserva.recursoNombre} está disponible otra vez.`;
  return `Reserva ${reserva.id} cancelada: ${reserva.recursoNombre} está disponible otra vez.`;
}

function notaDelEstado(r) {
  if (r.estado === 'liberada' && r.motivoLiberacion) return MOTIVO_LIBERACION[r.motivoLiberacion] ?? r.motivoLiberacion;
  if (r.estado === 'finalizado' && r.salioAntes) return `Se fue antes: liberó de ${r.horaFin} a ${r.horaFinOriginal}`;
  if (r.estado === 'finalizado' && r.salidaAutomatica) return 'Se cerró sola al terminar su hora';
  if (r.estado === 'en_uso' && r.ingresoEn) return `Adentro desde las ${fechaYHora(r.ingresoEn).hora}`;
  return null;
}

// Reservas de cubículos, estaciones y sala de lectura, para quien atiende el mostrador: cuánto lugar queda, quién está adentro, a
// quién se espera y qué hacer con cada uno. Si alguien no se presenta dentro del tiempo de tolerancia, el lugar se libera solo; si se
// va antes de que termine su hora, al sellar su salida las horas que no usó quedan libres para otras personas.
export default function ReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [lugares, setLugares] = useState(null);
  const [tolerancia, setTolerancia] = useState(15);
  const [ahora, setAhora] = useState(() => new Date());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [alcance, setAlcance] = useState('hoy');
  const [confirmacion, setConfirmacion] = useState(null); // { tipo, reserva } mientras se pide confirmar
  const [errorDeConfirmacion, setErrorDeConfirmacion] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [lista, resumen] = await Promise.all([reservasApi.listar(), adminApi.resumen()]);
      setReservas(lista.data.data);
      setLugares(resumen.data.data.reservas.lugares);
      setAhora(new Date());
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las reservas'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    reservasApi
      .condiciones()
      .then((res) => setTolerancia(res.data.data.toleranciaMinutos))
      .catch(() => {});
    // Se actualiza sola mientras la pestaña está a la vista: quien atiende ve lo que pasó sin tocar nada.
    const intervalo = setInterval(() => {
      if (!document.hidden) cargar();
    }, CADA_CUANTO_MS);
    return () => clearInterval(intervalo);
  }, [cargar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(''), 7000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  async function ejecutar(accion, reserva) {
    setTrabajando(true);
    setErrorDeConfirmacion('');
    try {
      const res = await ACCION_DE_LA_API[accion](reserva.id);
      setAviso(avisoDeResultado(accion, res.data.data));
      setError('');
      setConfirmacion(null);
    } catch (err) {
      const mensaje = getErrorMessage(err, 'No se pudo completar la acción');
      if (confirmacion) setErrorDeConfirmacion(mensaje);
      else setError(mensaje);
    } finally {
      setTrabajando(false);
    }
    await cargar();
  }

  const acciones = (reserva) => (
    <AccionesDeReserva
      reserva={reserva}
      ocupado={trabajando}
      onIngreso={() => ejecutar('ingreso', reserva)}
      onSalida={() => setConfirmacion({ tipo: 'salida', reserva })}
      onLiberar={() => setConfirmacion({ tipo: 'liberar', reserva })}
      onCancelar={() => setConfirmacion({ tipo: 'cancelar', reserva })}
    />
  );

  const reloj = relojDeLaBiblioteca(ahora);

  const deHoy = useMemo(() => {
    const grupos = { en_uso: [], esperando: [], por_llegar: [] };
    reservas.forEach((r) => {
      const situacion = situacionDeHoy(r, reloj, tolerancia);
      if (situacion) grupos[situacion.tipo].push({ reserva: r, situacion });
    });
    const porHora = (a, b) => a.reserva.hora.localeCompare(b.reserva.hora) || a.reserva.recursoNombre.localeCompare(b.reserva.recursoNombre, 'es', { numeric: true });
    Object.values(grupos).forEach((grupo) => grupo.sort(porHora));
    return grupos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservas, reloj.fecha, reloj.minutos, tolerancia]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = reservas.filter(
      (r) =>
        (!estado || r.estado === estado) &&
        (!tipo || r.tipo === tipo) &&
        (alcance === 'todas' ||
          (alcance === 'hoy' && r.fecha === reloj.fecha) ||
          (alcance === 'proximas' && r.fecha > reloj.fecha) ||
          (alcance === 'pasadas' && r.fecha < reloj.fecha)) &&
        (!texto ||
          [r.id, r.codigoConfirmacion, r.solicitante, r.identificacion, r.recursoNombre].some((v) => String(v ?? '').toLowerCase().includes(texto)))
    );
    const alRevez = alcance === 'pasadas' || alcance === 'todas'; // lo más reciente primero; hoy y próximas, por orden de hora
    return lista.sort((a, b) => {
      const orden = `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`) || a.recursoNombre.localeCompare(b.recursoNombre, 'es', { numeric: true });
      return alRevez ? -orden : orden;
    });
  }, [reservas, busqueda, estado, tipo, alcance, reloj.fecha]);
  const pagina = usePaginaLocal(filtradas, 40, [busqueda, estado, tipo, alcance]);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando reservas...
      </div>
    );
  }

  const hayAlgoAhora = deHoy.en_uso.length + deHoy.esperando.length + deHoy.por_llegar.length > 0;
  const textoDeConfirmar = confirmacion ? TEXTOS_DE_CONFIRMACION[confirmacion.tipo] : null;

  return (
    <PaginaAdmin
      descripcion="Qué lugares están ocupados, quién está adentro y a quién se espera. Si alguien no se presenta dentro del tiempo de tolerancia, el lugar se libera solo; si se va antes de que termine su hora, al registrar su salida las horas que no usó quedan libres."
      acciones={
        <Button variant="secondary" icon={RefreshCw} onClick={cargar}>
          Actualizar
        </Button>
      }
    >
      <AlertBanner>{error}</AlertBanner>
      {aviso ? (
        <Nota tono="ok">
          <span role="status">{aviso}</span>
        </Nota>
      ) : null}

      {lugares ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPOS.map((t) => (
            <OcupacionDeLugares key={t} tipo={t} datos={lugares[t]} />
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-white p-5" aria-label="Para atender ahora">
        <h2 className="text-base font-bold text-slate-900">Para atender ahora</h2>
        {!hayAlgoAhora ? <p className="text-sm text-slate-500">No hay nadie en la sala ni esperando por ahora: todas las reservas de hoy ya se atendieron.</p> : null}

        <GrupoDeAtencion titulo="Adentro ahora" color="bg-primary" cantidad={deHoy.en_uso.length} vacio="Nadie con una reserva en uso.">
          {deHoy.en_uso.map(({ reserva, situacion }) => (
            <FilaDeAtencion
              key={reserva.id}
              reserva={reserva}
              detalle={situacion.minutosParaTerminar > 0 ? `termina en ${textoDeDuracion(situacion.minutosParaTerminar)}` : 'su hora ya terminó'}
            >
              {acciones(reserva)}
            </FilaDeAtencion>
          ))}
        </GrupoDeAtencion>

        <GrupoDeAtencion titulo="Esperando a que llegue" color="bg-amber-400" cantidad={deHoy.esperando.length} vacio="Nadie por llegar con la hora ya empezada.">
          {deHoy.esperando.map(({ reserva, situacion }) => (
            <FilaDeAtencion
              key={reserva.id}
              reserva={reserva}
              detalle={
                situacion.minutosParaLiberarse > 0
                  ? `se libera sola a las ${situacion.liberaA} (en ${textoDeDuracion(situacion.minutosParaLiberarse)})`
                  : 'se libera en un momento'
              }
            >
              {acciones(reserva)}
            </FilaDeAtencion>
          ))}
        </GrupoDeAtencion>

        <GrupoDeAtencion titulo="Llegan más tarde hoy" color="bg-slate-300" cantidad={deHoy.por_llegar.length} vacio="No hay más reservas para hoy.">
          {deHoy.por_llegar.slice(0, MAXIMO_POR_LLEGAR).map(({ reserva, situacion }) => (
            <FilaDeAtencion key={reserva.id} reserva={reserva} detalle={`empieza en ${textoDeDuracion(situacion.minutosParaEmpezar)}`}>
              {acciones(reserva)}
            </FilaDeAtencion>
          ))}
        </GrupoDeAtencion>
        {deHoy.por_llegar.length > MAXIMO_POR_LLEGAR ? <p className="text-xs text-slate-500">y {deHoy.por_llegar.length - MAXIMO_POR_LLEGAR} más en la tabla de abajo</p> : null}
      </section>

      <section className="flex flex-col gap-3" aria-label="Todas las reservas">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Reservas</h2>
          <div className="inline-flex rounded-lg border border-border bg-white p-0.5" role="group" aria-label="Qué días mostrar">
            {ALCANCES.map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setAlcance(valor)}
                aria-pressed={alcance === valor}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  alcance === valor ? 'bg-primary text-white' : 'text-slate-600 hover:bg-surface'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
        <BarraDeFiltros
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          placeholder="Número, código, nombre, carné o lugar"
          filtros={[
            { etiqueta: 'Todos los estados', valor: estado, onCambio: setEstado, opciones: Object.entries(ESTADO_RESERVA).map(([clave, e]) => [clave, e.label]) },
            { etiqueta: 'Todos los lugares', valor: tipo, onCambio: setTipo, opciones: Object.entries(TIPO_RESERVA) },
          ]}
          resumen={`${filtradas.length} reserva${filtradas.length === 1 ? '' : 's'}`}
        />

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Reserva', 'Lugar', 'Persona', 'Cuándo', 'Estado'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagina.visibles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    {reservas.length === 0
                      ? 'Aún no hay reservas registradas.'
                      : alcance === 'hoy' && !busqueda && !estado && !tipo
                        ? 'No hay reservas para hoy. Cambia a «Próximas» o «Todas» para ver otros días.'
                        : 'Ninguna reserva coincide con lo que buscas.'}
                  </td>
                </tr>
              ) : (
                pagina.visibles.map((r) => {
                  const estadoDeReserva = ESTADO_RESERVA[r.estado] ?? { tone: 'neutral', label: r.estado };
                  const nota = notaDelEstado(r);
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2.5 font-mono">
                        {r.id}
                        {r.codigoConfirmacion ? <span className="block text-xs text-slate-500">{r.codigoConfirmacion}</span> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <LugarDeReserva reserva={r} />
                      </td>
                      <td className="px-3 py-2.5">
                        {r.solicitante}
                        {r.identificacion ? <span className="block font-mono text-xs text-slate-500">{r.identificacion}</span> : null}
                        <span className="block text-xs text-slate-500">{r.kiosco ? `Kiosco ${r.kiosco}` : 'Web'}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {fechaCorta(r.fecha)}
                        <span className="block font-mono text-xs text-slate-600">
                          {r.hora}–{r.horaFin}
                          {r.duracion > 1 ? ` · ${r.duracion} h` : ''}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={estadoDeReserva.tone}>{estadoDeReserva.label}</Badge>
                        {nota ? <span className="mt-1 block max-w-[14rem] text-xs text-slate-500">{nota}</span> : null}
                        {r.estado === 'reservado' || r.estado === 'en_uso' ? <div className="mt-2">{acciones(r)}</div> : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Paginacion pagina={pagina.pagina} paginas={pagina.paginas} onCambiar={pagina.irAPagina} />
      </section>

      <ModalConfirmar
        abierto={Boolean(confirmacion)}
        titulo={textoDeConfirmar?.titulo ?? ''}
        textoConfirmar={textoDeConfirmar?.boton}
        textoCancelar={textoDeConfirmar?.volver}
        peligro={textoDeConfirmar?.peligro}
        trabajando={trabajando}
        error={errorDeConfirmacion}
        onConfirmar={() => ejecutar(confirmacion.tipo, confirmacion.reserva)}
        onCancelar={() => {
          setConfirmacion(null);
          setErrorDeConfirmacion('');
        }}
      >
        {confirmacion ? <ContenidoDeConfirmacion tipo={confirmacion.tipo} reserva={confirmacion.reserva} reloj={reloj} /> : null}
      </ModalConfirmar>
    </PaginaAdmin>
  );
}
