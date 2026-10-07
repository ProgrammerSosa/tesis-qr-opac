import { Link } from 'react-router-dom';
import { CalendarX, Clock, MapPin, MessageCircle } from 'lucide-react';
import EnlaceExterno from '../../shared/components/EnlaceExterno';
import EstadoDeApertura from '../../shared/components/EstadoDeApertura';
import Nota from '../../shared/components/Nota';
import Page from '../../shared/components/Page';
import Redes from '../../shared/components/Redes';
import SectionHeading from '../../shared/components/SectionHeading';
import TablaDeHorarios from '../../shared/components/TablaDeHorarios';
import { Esqueleto } from '../../shared/components/Cargando';
import { ENLACE_WHATSAPP, LIBRARY } from '../../shared/config/library';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import { usePortada } from '../../shared/portada/PortadaContext';
import { fechaConMes } from '../../shared/utils/fechas';

function rangoDeCierre(c) {
  return c.desde === c.hasta ? fechaConMes(c.desde) : `del ${fechaConMes(c.desde)} al ${fechaConMes(c.hasta)}`;
}

export default function HorariosPage() {
  const { esKiosco } = useKiosco();
  const { portada, cargando } = usePortada();
  const horario = portada?.horario;

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Horarios y contacto' }]}
      title="Horarios y contacto"
      subtitle="Cuándo atendemos, cuándo puedes reservar un lugar de estudio y cómo comunicarte con nosotros."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="atencion-titulo" className="flex flex-col gap-4">
            <SectionHeading as="h2" etiqueta="Atención al público">
              <span id="atencion-titulo">Horarios de la semana</span>
            </SectionHeading>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
              <EstadoDeApertura tema="claro" className="text-base" />
            </div>
            {cargando && !horario ? <Esqueleto className="h-72" /> : <TablaDeHorarios semana={horario?.semana} conReservas />}
            <p className="text-sm leading-relaxed text-slate-600">
              La columna «Reservas de lugares» indica las horas en las que se pueden reservar cubículos, estaciones y sillas de la{' '}
              <Link to="/sala-de-estudio" className="font-semibold text-primary hover:underline">
                sala de estudio
              </Link>
              . Las solvencias se entregan de lunes a viernes, salvo días de asueto (consulta los horarios de entrega en la{' '}
              <Link to="/solvencia" className="font-semibold text-primary hover:underline">
                página de solvencias
              </Link>
              ).
            </p>
          </section>

          <section aria-labelledby="cierres-titulo" className="flex flex-col gap-4">
            <SectionHeading as="h2" etiqueta="Calendario">
              <span id="cierres-titulo">Días de cierre</span>
            </SectionHeading>
            {horario && horario.proximosCierres.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {horario.proximosCierres.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <CalendarX size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-amber-950">{c.motivo}</p>
                      <p className="text-sm text-amber-900">Sin atención ni reservas {rangoDeCierre(c)}.</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Nota tono="info">No hay cierres anunciados por ahora. Si cambia el horario por un asueto o un inventario, lo publicaremos aquí y en el inicio.</Nota>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-card" aria-labelledby="ubicacion-titulo">
            <h2 id="ubicacion-titulo" className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
              <MapPin size={20} className="text-action" aria-hidden="true" />
              Dónde estamos
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{LIBRARY.direccion}.</p>
            <p className="mt-1 text-sm text-slate-600">{LIBRARY.ubicacion}</p>
            {!esKiosco ? (
              <EnlaceExterno href={LIBRARY.comoLlegar} className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark">
                Abrir en el mapa
              </EnlaceExterno>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-card" aria-labelledby="contacto-titulo">
            <h2 id="contacto-titulo" className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
              <MessageCircle size={20} className="text-action" aria-hidden="true" />
              Contáctanos
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Escríbenos por WhatsApp o por las redes de la biblioteca. Te respondemos en el horario de atención.
            </p>
            <p className="mt-3 text-base font-bold text-slate-900">WhatsApp {LIBRARY.whatsapp.texto}</p>
            {!esKiosco ? (
              <>
                <a
                  href={ENLACE_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-action px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-action-dark"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Escribir por WhatsApp
                </a>
                <Redes variante="botones" className="mt-4" />
              </>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6" aria-labelledby="tiempos-titulo">
            <h2 id="tiempos-titulo" className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
              <Clock size={20} className="text-action" aria-hidden="true" />
              Tiempos de respuesta
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-slate-700">
              <li>
                <b>Referencias bibliográficas:</b> hasta 24 horas hábiles.
              </li>
              <li>
                <b>Solvencias:</b> el mismo día o el siguiente día hábil, según la hora en que envíes la solicitud.
              </li>
              <li>
                <b>Tesis en formato digital:</b> te avisamos por correo cuando esté publicada.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </Page>
  );
}
