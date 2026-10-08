import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, CalendarCheck, Clock, FileCheck2, FileText, Loader2, MonitorSmartphone, Search } from 'lucide-react';
import { adminApi } from '../adminApi';
import { reservasApi } from '../../reservas/reservasApi';
import { solvenciaApi } from '../../solvencia/solvenciaApi';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { puedeVer } from '../secciones';
import { useSesionAdmin } from '../SesionAdmin';
import { ACCIONES_DE_ACTIVIDAD, ESTADO_RESERVA, ESTADO_SOLVENCIA, ROLES_DEL_PERSONAL, fechaLegible } from '../estados';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import StatTile from '../../../shared/components/StatTile';
import { RUTA_DEL_PANEL } from '../../../shared/config/rutas';
import { fechaCorta, fechaLarga, hoyISO } from '../../../shared/utils/fechas';

// Qué datos pide el resumen y qué sección debe poder ver el rol para recibirlos: cada rol ve solo lo suyo.
const PEDIDOS = {
  resumen: { seccion: 'resumen', pedir: () => adminApi.resumen(), nombre: 'las cifras' },
  reservas: { seccion: 'reservas', pedir: () => reservasApi.listar(), nombre: 'las reservas' },
  solicitudes: { seccion: 'solicitudes', pedir: () => solvenciaApi.listar(), nombre: 'las solicitudes de solvencia' },
  estadisticas: { seccion: 'estadisticas', pedir: () => adminApi.estadisticas(), nombre: 'las estadísticas' },
  actividad: { seccion: 'actividad', pedir: () => adminApi.actividad({ limite: 6 }), nombre: 'la actividad' },
};

const MAXIMO_POR_LISTA = 6;

function Bloque({ titulo, enlace, textoEnlace, children }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{titulo}</h2>
        {enlace ? (
          <Link to={enlace} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline">
            {textoEnlace}
            <ArrowRight size={13} />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Vacio({ children }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

// Inicio del panel: cifras del día y lo que está esperando atención, según el rol.
export default function ResumenPage() {
  const { sesion } = useSesionAdmin();
  const rol = sesion.rol;
  const [datos, setDatos] = useState(null);
  const [fallos, setFallos] = useState([]);

  useEffect(() => {
    let vigente = true;
    const claves = Object.keys(PEDIDOS).filter((clave) => puedeVer(rol, PEDIDOS[clave].seccion));
    Promise.allSettled(claves.map((clave) => PEDIDOS[clave].pedir())).then((resultados) => {
      if (!vigente) return;
      const recibidos = {};
      const fallidos = [];
      resultados.forEach((resultado, i) => {
        if (resultado.status === 'fulfilled') recibidos[claves[i]] = resultado.value.data.data;
        else fallidos.push(PEDIDOS[claves[i]].nombre);
      });
      setDatos(recibidos);
      setFallos(fallidos);
    });
    return () => {
      vigente = false;
    };
  }, [rol]);

  if (!datos) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando el resumen...
      </div>
    );
  }

  const cifras = datos.resumen;
  const tarjetas = [];
  if (cifras && datos.reservas) {
    tarjetas.push(
      { etiqueta: 'Reservas activas', valor: cifras.reservas.activas, icono: Clock },
      { etiqueta: 'Reservas de hoy', valor: cifras.reservas.hoy, icono: CalendarCheck },
      { etiqueta: 'Solvencias pendientes', valor: cifras.solvencia.pendientes, icono: FileCheck2 }
    );
  }
  if (cifras && puedeVer(rol, 'catalogo')) {
    tarjetas.push(
      { etiqueta: 'Tesis en el catálogo', valor: cifras.tesis.total, icono: BookMarked },
      { etiqueta: 'Con documento digital', valor: cifras.tesis.conDocumentoDigital, icono: FileText }
    );
  }
  if (tarjetas.length === 0 && datos.estadisticas) {
    const t = datos.estadisticas.totales;
    tarjetas.push(
      { etiqueta: 'Búsquedas en el OPAC', valor: t.busquedasOpac, icono: Search },
      { etiqueta: 'Consultas de tesis digitales', valor: t.consultasDigitales, icono: FileText },
      { etiqueta: 'Reservas hechas', valor: t.reservasCubiculos + t.reservasEspacios, icono: CalendarCheck },
      { etiqueta: 'Sesiones en kioscos', valor: t.sesionesKiosco, icono: MonitorSmartphone }
    );
  }

  const hoy = hoyISO();
  const reservasDeHoy = (datos.reservas ?? [])
    .filter((r) => r.fecha === hoy && ['reservado', 'en_uso'].includes(r.estado))
    .sort((a, b) => a.hora.localeCompare(b.hora));
  const solicitudesPorRevisar = (datos.solicitudes ?? [])
    .filter((s) => ['pendiente', 'en_revision'].includes(s.estado))
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn)); // las más antiguas primero
  const codigosPorRevisar = cifras?.tesis?.qrPorRevisarMuestra ?? [];
  const fechaDeHoy = fechaLarga(hoy);

  return (
    <PaginaAdmin>
      <div className="rounded-xl border border-border bg-white p-5">
        <p className="text-sm text-slate-500 first-letter:uppercase">{fechaDeHoy}</p>
        <h2 className="mt-0.5 text-xl font-bold text-slate-900">Hola, {sesion.nombre}</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          {ROLES_DEL_PERSONAL[rol]?.nombre}: {ROLES_DEL_PERSONAL[rol]?.descripcion.toLowerCase()}.
        </p>
      </div>

      {fallos.length > 0 ? <AlertBanner>{`No se pudieron cargar ${fallos.join(', ')}. Recarga la página para intentarlo de nuevo.`}</AlertBanner> : null}

      {tarjetas.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {tarjetas.map((t) => (
            <StatTile key={t.etiqueta} label={t.etiqueta} value={t.valor} icon={t.icono} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {datos.reservas ? (
          <Bloque titulo="Reservas de hoy por atender" enlace={`${RUTA_DEL_PANEL}/reservas`} textoEnlace="Ver las reservas">
            {reservasDeHoy.length === 0 ? (
              <Vacio>No hay reservas pendientes para hoy.</Vacio>
            ) : (
              <ul className="divide-y divide-border">
                {reservasDeHoy.slice(0, MAXIMO_POR_LISTA).map((r) => {
                  const estado = ESTADO_RESERVA[r.estado];
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="font-mono text-slate-700">
                          {r.hora}–{r.horaFin}
                        </span>{' '}
                        <span className="font-semibold text-slate-900">{r.recursoNombre}</span>
                        <span className="block truncate text-xs text-slate-500">{r.solicitante}</span>
                      </span>
                      <Badge tone={estado.tone}>{estado.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            {reservasDeHoy.length > MAXIMO_POR_LISTA ? <p className="text-xs text-slate-500">y {reservasDeHoy.length - MAXIMO_POR_LISTA} más</p> : null}
          </Bloque>
        ) : null}

        {datos.solicitudes ? (
          <Bloque titulo="Solvencias por revisar" enlace={`${RUTA_DEL_PANEL}/solicitudes`} textoEnlace="Ver las solvencias">
            {solicitudesPorRevisar.length === 0 ? (
              <Vacio>No hay solvencias esperando revisión.</Vacio>
            ) : (
              <ul className="divide-y divide-border">
                {solicitudesPorRevisar.slice(0, MAXIMO_POR_LISTA).map((s) => {
                  const estado = ESTADO_SOLVENCIA[s.estado];
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="font-mono text-slate-700">{s.id}</span> <span className="font-semibold text-slate-900">{s.solicitante}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {s.motivo}
                          {s.entregaEstimada ? ` · entrega ${fechaCorta(s.entregaEstimada.fecha)} ${s.entregaEstimada.hora}` : ''}
                        </span>
                      </span>
                      <Badge tone={estado.tone}>{estado.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            {solicitudesPorRevisar.length > MAXIMO_POR_LISTA ? (
              <p className="text-xs text-slate-500">y {solicitudesPorRevisar.length - MAXIMO_POR_LISTA} más</p>
            ) : null}
          </Bloque>
        ) : null}

        {cifras && puedeVer(rol, 'qr') ? (
          <Bloque titulo="Códigos QR por revisar" enlace={`${RUTA_DEL_PANEL}/qr`} textoEnlace="Ver los códigos">
            {codigosPorRevisar.length === 0 ? (
              <Vacio>Todos los códigos activos fueron verificados y responden.</Vacio>
            ) : (
              <ul className="divide-y divide-border">
                {codigosPorRevisar.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-900">{t.titulo}</span>
                      <span className="font-mono text-xs text-slate-500">{t.id}</span>
                    </span>
                    <Badge tone={t.resultado === 'enlace_roto' ? 'danger' : 'warning'}>{t.resultado === 'enlace_roto' ? 'Enlace roto' : 'Sin verificar'}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {cifras.tesis.qrPorRevisar > codigosPorRevisar.length ? (
              <p className="text-xs text-slate-500">y {cifras.tesis.qrPorRevisar - codigosPorRevisar.length} más</p>
            ) : null}
          </Bloque>
        ) : null}

        {datos.estadisticas ? (
          <Bloque titulo="Uso de los servicios" enlace={`${RUTA_DEL_PANEL}/estadisticas`} textoEnlace="Ver las estadísticas">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ['Búsquedas en el OPAC', datos.estadisticas.totales.busquedasOpac],
                ['Consultas de tesis digitales', datos.estadisticas.totales.consultasDigitales],
                ['Accesos por código QR', datos.estadisticas.totales.accesosQr],
                ['Sesiones en kioscos', datos.estadisticas.totales.sesionesKiosco],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta}>
                  <dt className="text-xs text-slate-500">{etiqueta}</dt>
                  <dd className="text-lg font-bold text-slate-900">{valor}</dd>
                </div>
              ))}
            </dl>
          </Bloque>
        ) : null}

        {datos.actividad ? (
          <Bloque titulo="Últimos movimientos del personal" enlace={`${RUTA_DEL_PANEL}/actividad`} textoEnlace="Ver toda la actividad">
            {datos.actividad.registros.length === 0 ? (
              <Vacio>Todavía no hay movimientos.</Vacio>
            ) : (
              <ul className="divide-y divide-border">
                {datos.actividad.registros.map((r) => (
                  <li key={r.id} className="py-2 text-sm">
                    <span className="font-semibold text-slate-900">{r.nombre ?? r.usuario}</span>{' '}
                    <span className="text-slate-700">{(ACCIONES_DE_ACTIVIDAD[r.accion] ?? r.accion).toLowerCase()}</span>
                    <span className="block text-xs text-slate-500">
                      {fechaLegible(r.fecha)}
                      {r.detalle ? ` · ${r.detalle}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        ) : null}
      </div>
    </PaginaAdmin>
  );
}
