import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Clock, FileText, Landmark, MapPin, MessageCircle } from 'lucide-react';
import { catalogApi } from '../catalog/catalogApi';
import ThesisCard from '../catalog/ThesisCard';
import Container from '../../shared/components/Container';
import EnlaceExterno from '../../shared/components/EnlaceExterno';
import EstadoDeApertura from '../../shared/components/EstadoDeApertura';
import HeroSearch from '../../shared/components/HeroSearch';
import Redes from '../../shared/components/Redes';
import SectionHeading from '../../shared/components/SectionHeading';
import ServiceCard from '../../shared/components/ServiceCard';
import TablaDeHorarios from '../../shared/components/TablaDeHorarios';
import { ListaDeAvisos } from '../../shared/components/Avisos';
import { useAvisos } from '../../shared/portada/avisos';
import { Esqueleto } from '../../shared/components/Cargando';
import { ENLACE_WHATSAPP, LIBRARY } from '../../shared/config/library';
import { SERVICIOS } from '../../shared/config/navegacion';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import { usePortada } from '../../shared/portada/PortadaContext';
import { useTitulo } from '../../shared/hooks/useTitulo';
import { textoDeTramos } from '../../shared/utils/fechas';

const ATAJOS = [
  { to: '/catalogo?tipo=tesis_grado', etiqueta: 'Tesis de grado' },
  { to: '/catalogo?tipo=tesis_posgrado', etiqueta: 'Tesis de posgrado' },
  { to: '/catalogo?digital=1', etiqueta: 'Con documento digital' },
  { to: '/catalogo?avanzada=1', etiqueta: 'Búsqueda avanzada' },
];

// La tarjeta del hero: el horario de hoy y si la biblioteca atiende ahora.
function HorarioDeHoy() {
  const { portada, cargando } = usePortada();
  const hoy = portada?.horario?.semana?.find((d) => d.esHoy);

  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
        <Clock size={15} aria-hidden="true" />
        Horario de hoy
      </p>
      {cargando && !portada ? (
        <div className="mt-4 space-y-3" aria-hidden="true">
          <div className="h-6 w-2/3 animate-pulse rounded bg-white/15" />
          <div className="h-14 animate-pulse rounded bg-white/15" />
        </div>
      ) : hoy ? (
        <>
          <p className="mt-3">
            <EstadoDeApertura conDetalle={false} className="[&>span:nth-child(2)]:text-lg" />
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-white/60">Atención al público</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{textoDeTramos(hoy.atencion)}</dd>
            </div>
            <div>
              <dt className="text-white/60">Reserva de cubículos y lugares</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{textoDeTramos(hoy.reservas)}</dd>
            </div>
          </dl>
          <Link to="/horarios" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-white hover:underline">
            Ver el horario de toda la semana
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm text-white/80">
          No pudimos consultar el horario en este momento.{' '}
          <Link to="/horarios" className="font-bold underline">
            Ver horarios
          </Link>
        </p>
      )}
    </div>
  );
}

function Cifra({ icono: Icono, valor, etiqueta }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-card">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
        <Icono size={24} strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-3xl font-semibold leading-none text-slate-900 tabular-nums">{valor ?? '—'}</p>
        <p className="mt-1.5 text-sm text-slate-600">{etiqueta}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  useTitulo(null);
  const { esKiosco } = useKiosco();
  const { portada } = usePortada();
  const avisos = useAvisos();
  const [recientes, setRecientes] = useState(null);
  const [totales, setTotales] = useState({ tesis: null, digitales: null });

  useEffect(() => {
    // Secciones informativas: si el catálogo no responde, simplemente no se muestran.
    catalogApi
      .buscar({ porPagina: 4 })
      .then((res) => {
        setRecientes(res.data.data.items);
        setTotales((t) => ({ ...t, tesis: res.data.data.total }));
      })
      .catch(() => setRecientes([]));
    catalogApi
      .buscar({ digital: '1', porPagina: 1 })
      .then((res) => setTotales((t) => ({ ...t, digitales: res.data.data.total })))
      .catch(() => {});
  }, []);

  const diasDeAtencion = portada?.horario?.semana?.filter((d) => d.atencion.length > 0).length ?? null;

  return (
    <>
      <section className="hero-bg border-t-4 border-t-action text-white">
        <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-100">
              <Landmark size={14} aria-hidden="true" />
              {LIBRARY.facultad} · USAC
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              Encuentra tesis, reserva tu espacio de estudio y <span className="text-red-400">realiza tus trámites</span> en línea
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">
              Catálogo de tesis de grado y posgrado, cubículos de estudio, solvencias y referencias bibliográficas de la{' '}
              {LIBRARY.nombre}.
            </p>
            <div className="mt-8 max-w-2xl">
              <HeroSearch />
            </div>
            <ul className="mt-5 flex flex-wrap items-center gap-2">
              <li className="mr-1 text-sm text-white/60">Atajos:</li>
              {ATAJOS.map((a) => (
                <li key={a.to}>
                  <Link
                    to={a.to}
                    className="inline-flex rounded-full border border-white/25 px-3.5 py-1.5 text-sm font-medium text-white/90 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
                  >
                    {a.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <HorarioDeHoy />
        </Container>
      </section>

      <section className="bg-surface py-14 sm:py-16" aria-labelledby="servicios-titulo">
        <Container>
          <SectionHeading etiqueta="Servicios" descripcion="Todo lo que ofrece la biblioteca, a un toque de distancia. Elige lo que necesitas.">
            <span id="servicios-titulo">¿Qué necesitas hoy?</span>
          </SectionHeading>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICIOS.map((s) => (
              <li key={s.clave}>
                <ServiceCard to={s.to} icono={s.icono} titulo={s.tituloCorto ?? s.titulo} accion={s.accion} acento={s.acento}>
                  {s.resumen}
                </ServiceCard>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {avisos.length > 0 ? (
        <section id="avisos" className="scroll-mt-24 py-14 sm:py-16" aria-labelledby="avisos-titulo">
          <Container>
            <SectionHeading etiqueta="Avisos" descripcion="Cierres, cambios de horario y novedades de la biblioteca.">
              <span id="avisos-titulo">Lo que debes saber</span>
            </SectionHeading>
            <ListaDeAvisos className="mt-8" />
          </Container>
        </section>
      ) : null}

      <section className={`${avisos.length > 0 ? 'bg-surface' : ''} py-14 sm:py-16`} aria-label="La biblioteca en cifras">
        <Container>
          <div className="grid gap-5 sm:grid-cols-3">
            <Cifra icono={BookOpen} valor={totales.tesis?.toLocaleString('es-GT')} etiqueta="tesis y seminarios en el catálogo" />
            <Cifra icono={FileText} valor={totales.digitales?.toLocaleString('es-GT')} etiqueta="con documento digital para consultar" />
            <Cifra icono={CalendarDays} valor={diasDeAtencion} etiqueta="días a la semana de atención al público" />
          </div>
        </Container>
      </section>

      {recientes === null || recientes.length > 0 ? (
        <section className={`${avisos.length > 0 ? '' : 'bg-surface'} py-14 sm:py-16`} aria-labelledby="recientes-titulo">
          <Container>
            <SectionHeading
              etiqueta="Catálogo"
              descripcion="Las tesis más recientes registradas en el catálogo de la biblioteca."
              accion={
                <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                  Ver todo el catálogo
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              }
            >
              <span id="recientes-titulo">Tesis recientes</span>
            </SectionHeading>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {recientes === null
                ? [0, 1, 2, 3].map((n) => <Esqueleto key={n} className="h-36" />)
                : recientes.map((t) => <ThesisCard key={t.id} tesis={t} />)}
            </div>
          </Container>
        </section>
      ) : null}

      <section className={`${avisos.length > 0 ? 'bg-surface' : ''} py-14 sm:py-16`} aria-labelledby="horarios-titulo">
        <Container>
          <SectionHeading etiqueta="Visítanos" descripcion="Atendemos todos los días de la semana. Los cierres por asueto se anuncian en esta página.">
            <span id="horarios-titulo">Horarios y ubicación</span>
          </SectionHeading>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <TablaDeHorarios semana={portada?.horario?.semana} />
            <div className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-card">
              <div className="flex gap-3">
                <MapPin size={22} className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-slate-900">Dónde estamos</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{LIBRARY.direccion}.</p>
                  <p className="mt-1 text-sm text-slate-600">{LIBRARY.ubicacion}</p>
                  {!esKiosco ? (
                    <EnlaceExterno href={LIBRARY.comoLlegar} className="mt-2 inline-block text-sm font-bold text-primary hover:underline">
                      Cómo llegar
                    </EnlaceExterno>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-3 border-t border-border pt-5">
                <MessageCircle size={22} className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-slate-900">Escríbenos</h3>
                  <p className="mt-1 text-sm text-slate-600">Resolvemos tus dudas por WhatsApp y por las redes de la biblioteca.</p>
                  {!esKiosco ? (
                    <a
                      href={ENLACE_WHATSAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      WhatsApp {LIBRARY.whatsapp.texto}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-slate-800">WhatsApp {LIBRARY.whatsapp.texto}</p>
                  )}
                  <Redes className="mt-3" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
