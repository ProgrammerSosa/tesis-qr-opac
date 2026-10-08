import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarX, Clock, MapPin, Share2 } from 'lucide-react';
import { reservasApi } from '../reservas/reservasApi';
import Container from '../../shared/components/Container';
import EnlaceExterno from '../../shared/components/EnlaceExterno';
import Nota from '../../shared/components/Nota';
import Redes from '../../shared/components/Redes';
import SectionHeading from '../../shared/components/SectionHeading';
import TablaDeHorarios from '../../shared/components/TablaDeHorarios';
import { Esqueleto } from '../../shared/components/Cargando';
import { LIBRARY } from '../../shared/config/library';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import { fechaConMes, textoDeTramos } from '../../shared/utils/fechas';

function rangoDeCierre(c) {
  return c.desde === c.hasta ? fechaConMes(c.desde) : `del ${fechaConMes(c.desde)} al ${fechaConMes(c.hasta)}`;
}

// Lo que pasa hoy con las reservas: las horas de hoy o el motivo por el que hoy no hay servicio.
function EstadoDeHoy({ hoy }) {
  const cerrado = hoy.cerrado || hoy.ventanasDeReserva.length === 0;
  return (
    <p role="status" className="flex items-start gap-2.5 rounded-xl border border-border bg-white px-4 py-3 text-sm">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${cerrado ? 'bg-red-400' : 'bg-emerald-500'}`} aria-hidden="true" />
      <span>
        <b className="text-slate-900">{cerrado ? 'Hoy no hay reservas' : 'Hoy se reservan lugares'}</b>
        <span className="text-slate-600">
          {' '}
          · {hoy.cerrado ? hoy.motivo : cerrado ? `${hoy.dia} sin servicio` : textoDeTramos(hoy.ventanasDeReserva)}
        </span>
      </span>
    </p>
  );
}

// «Horarios y ubicación» del inicio: las horas de reserva de la semana, los días de cierre, dónde está la biblioteca y sus redes.
// En un kiosco no hay enlaces a otros sitios: se muestran las direcciones como texto.
export default function HorariosYUbicacion() {
  const { esKiosco } = useKiosco();
  const [datos, setDatos] = useState(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    reservasApi
      .horarioSemanal()
      .then((res) => vigente && setDatos(res.data.data))
      .catch(() => vigente && setFallo(true));
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <section id="horarios-y-ubicacion" className="scroll-mt-24 py-12 sm:py-16" aria-labelledby="horarios-titulo">
      <Container>
        <SectionHeading etiqueta="Visítanos" descripcion="Las horas en que puedes reservar un lugar de estudio y cómo llegar a la biblioteca.">
          <span id="horarios-titulo">Horarios y ubicación</span>
        </SectionHeading>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            {datos ? (
              <>
                <EstadoDeHoy hoy={datos.hoy} />
                <TablaDeHorarios semana={datos.semana} />
                {datos.proximosCierres.length > 0 ? (
                  <ul className="flex flex-col gap-3" aria-label="Próximos días de cierre">
                    {datos.proximosCierres.map((c) => (
                      <li key={c.id} className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                        <CalendarX size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                        <div>
                          <p className="font-bold text-amber-950">{c.motivo}</p>
                          <p className="text-sm text-amber-900">Sin reservas {rangoDeCierre(c)}.</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : fallo ? (
              <Nota tono="aviso">No pudimos consultar los horarios en este momento. Intenta de nuevo en unos minutos.</Nota>
            ) : (
              <Esqueleto className="h-80" />
            )}
            <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
              <Clock size={16} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
              <span>
                Las reservas son por horas enteras dentro de estos horarios.{' '}
                <Link to="/sala-de-estudio" className="font-semibold text-primary hover:underline">
                  Reservar un lugar de estudio
                </Link>
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-5 self-start rounded-2xl border border-border bg-white p-6 shadow-card">
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
            {!esKiosco ? (
              <div className="flex gap-3 border-t border-border pt-5">
                <Share2 size={22} className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-slate-900">Síguenos</h3>
                  <p className="mt-1 text-sm text-slate-600">Novedades, avisos y actividades de la biblioteca en sus redes.</p>
                  <Redes variante="botones" className="mt-3" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
