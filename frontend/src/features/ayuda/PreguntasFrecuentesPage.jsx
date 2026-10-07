import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Acordeon, { ItemDeAcordeon } from '../../shared/components/Acordeon';
import EnlaceExterno from '../../shared/components/EnlaceExterno';
import Page from '../../shared/components/Page';
import SectionHeading from '../../shared/components/SectionHeading';
import { ENLACE_WHATSAPP, ENLACES_EXTERNOS, LIBRARY } from '../../shared/config/library';
import { useKiosco } from '../../shared/kiosco/KioscoContext';
import { reservasApi } from '../reservas/reservasApi';

const V = ({ to, children }) => (
  <Link to={to} className="font-semibold text-primary hover:underline">
    {children}
  </Link>
);

export default function PreguntasFrecuentesPage() {
  const { esKiosco } = useKiosco();
  const [tolerancia, setTolerancia] = useState(15);

  useEffect(() => {
    reservasApi
      .condiciones()
      .then((res) => setTolerancia(res.data.data.toleranciaMinutos))
      .catch(() => {});
  }, []);

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Preguntas frecuentes' }]}
      title="Preguntas frecuentes"
      subtitle="Respuestas rápidas sobre el catálogo, las reservas y los trámites de la biblioteca."
      ancho="lectura"
    >
      <div className="flex flex-col gap-12">
        <section aria-labelledby="faq-catalogo" className="flex flex-col gap-5">
          <SectionHeading as="h2" etiqueta="Catálogo y tesis">
            <span id="faq-catalogo">Buscar y consultar tesis</span>
          </SectionHeading>
          <Acordeon>
            <ItemDeAcordeon pregunta="¿Qué encuentro en el catálogo?" abierto>
              <p>
                Las tesis de grado, de posgrado, doctorales y los seminarios de la Facultad. Cada ficha muestra el autor, el año, los
                temas, un resumen y dónde está el ejemplar en la biblioteca. Puedes buscar por autor, título, año, tema o tipo de
                documento desde el <V to="/catalogo">catálogo de tesis</V>.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Puedo leer o descargar la tesis desde mi casa?">
              <p>
                Depende de su nivel de acceso. Algunas tesis tienen documento digital para <b>consulta en línea</b>, otras permiten también la{' '}
                <b>descarga</b> en PDF y otras solo existen como ejemplar impreso, que se consulta en la biblioteca. La ficha de cada tesis indica cuál es el caso.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="La tesis que necesito no tiene documento digital. ¿Qué hago?">
              <p>
                Puedes <V to="/tesis-digital">solicitar la tesis en formato digital</V>. La biblioteca publica en el repositorio las
                tesis de grado desde el año 2010 y las de posgrado desde el año 2016. Cuando la tesis esté lista, recibirás un aviso en
                tu correo. Para tesis anteriores, consulta el ejemplar impreso en la biblioteca.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Qué es el código QR de la contraportada?">
              <p>
                Cada tesis impresa lleva una etiqueta con un código QR. Al escanearlo con tu teléfono abres la ficha de esa tesis en
                el catálogo, sin necesidad de pedir el ejemplar físico.
              </p>
            </ItemDeAcordeon>
          </Acordeon>
        </section>

        <section aria-labelledby="faq-reservas" className="flex flex-col gap-5">
          <SectionHeading as="h2" etiqueta="Sala de estudio">
            <span id="faq-reservas">Reservar cubículos y lugares</span>
          </SectionHeading>
          <Acordeon>
            <ItemDeAcordeon pregunta="¿Cómo reservo un cubículo?">
              <p>
                Entra a la <V to="/sala-de-estudio">sala de estudio</V>, elige el día y la hora, y toca un lugar libre en el plano.
                Escribe tu nombre y tu carné (o correo institucional o documento) y confirma. Recibes un comprobante que puedes
                imprimir o enviar a tu correo.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Qué diferencia hay entre los cubículos?">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <b>Cubículos 1 a 4 — preparación de fases:</b> reservas de 4 a 8 horas por día.
                </li>
                <li>
                  <b>Cubículos 5 y 6 — estudio regular:</b> bloques de 2 horas, hasta 4 horas por día.
                </li>
              </ul>
              <p className="mt-2">Todos tienen internet y sirven para trabajar en grupo.</p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Qué pasa si llego tarde?">
              <p>
                Debes presentarte dentro de los {tolerancia} minutos siguientes a la hora de inicio. Pasado ese tiempo la reserva se
                libera y el lugar queda disponible para otra persona. La biblioteca puede cancelar una reserva si se incumple el
                reglamento del servicio.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Con cuánta anticipación puedo reservar?">
              <p>
                Puedes reservar desde hoy hasta 30 días adelante, dentro de los horarios de reserva de cada día (consulta los{' '}
                <V to="/horarios">horarios</V>). En días de cierre no hay reservas.
              </p>
            </ItemDeAcordeon>
          </Acordeon>
        </section>

        <section aria-labelledby="faq-solvencia" className="flex flex-col gap-5">
          <SectionHeading as="h2" etiqueta="Trámites">
            <span id="faq-solvencia">Solvencias, tesis digitales y referencias</span>
          </SectionHeading>
          <Acordeon>
            <ItemDeAcordeon pregunta="¿Quién puede pedir una solvencia?">
              <p>
                El servicio de <V to="/solvencia">solvencias</V> es para estudiantes de la {LIBRARY.facultad} del Campus Central.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Cuándo debo hacer la solicitud?">
              <p>
                Con al menos 24 horas de anticipación a la fecha en que presentarás tu papelería, y con un máximo de 7 días. La
                solvencia se entrega de lunes a viernes; los días festivos o de asueto no hay entrega.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Cuándo recibo mi solvencia?">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Si envías la solicitud de 08:00 a 13:00 horas, la entrega es a las 15:00 horas del mismo día.</li>
                <li>Si la envías de 13:01 a 17:00 horas, la entrega es a las 18:00 horas del mismo día.</li>
                <li>Si la envías de 17:01 a 07:59 horas, la entrega es a las 14:00 horas del siguiente día hábil.</li>
              </ul>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Cómo genero y pago la orden de pago?">
              <p>
                La orden de pago se genera en el sistema SIIF de la USAC
                {!esKiosco ? (
                  <>
                    {' '}
                    (<EnlaceExterno href={ENLACES_EXTERNOS.siif} className="font-semibold text-primary hover:underline">siif.usac.edu.gt</EnlaceExterno>)
                  </>
                ) : null}{' '}
                y se cancela en una agencia de Bantrab, Banrural o G&amp;T Continental. Antes de enviar la solicitud, verifica que en el detalle de pago
                aparezca la solvencia de biblioteca de tu unidad académica y que el número de orden sea el mismo de tu boleta de depósito.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="Me equivoqué en un dato de mi solicitud. ¿Puedo corregirlo?">
              <p>
                Revisa tus datos antes de enviar: al terminar te confirmamos por correo lo que recibimos. Si hay un error, tendrás que enviar una
                nueva solicitud. Si la solvencia llega a emitirse con errores en el nombre, el CUI, el carné o la fecha de papelería, no hay
                reposición y debes pagar y tramitar de nuevo.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="No me llegó el correo de confirmación.">
              <p>
                Si pasan 5 minutos y no recibes la confirmación, probablemente escribiste mal tu correo: envía una nueva solicitud con el
                correo bien escrito. Revisa también la carpeta de correo no deseado.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿En cuánto tiempo me responden una referencia bibliográfica?">
              <p>
                Recibirás tu <V to="/referencias">referencia</V> por correo en un plazo de 24 horas, contadas en días y horas hábiles.
              </p>
            </ItemDeAcordeon>
          </Acordeon>
        </section>

        <section aria-labelledby="faq-kiosco" className="flex flex-col gap-5">
          <SectionHeading as="h2" etiqueta="En la biblioteca">
            <span id="faq-kiosco">Kioscos y privacidad</span>
          </SectionHeading>
          <Acordeon>
            <ItemDeAcordeon pregunta="¿Por qué se cierra la pantalla del kiosco sola?">
              <p>
                Por tu privacidad: si nadie toca la pantalla durante un minuto y medio, aparece un aviso y, si no respondes, la sesión se
                cierra y se borra lo que escribiste, para que la persona siguiente no vea tus datos.
              </p>
            </ItemDeAcordeon>
            <ItemDeAcordeon pregunta="¿Qué datos guarda la biblioteca?">
              <p>
                Solo los necesarios para atender tu reserva o tu trámite. Más detalle en el <V to="/privacidad">aviso de privacidad</V>.
              </p>
            </ItemDeAcordeon>
          </Acordeon>
        </section>

        <div className="rounded-2xl bg-surface p-6 text-center">
          <h2 className="font-display text-xl font-semibold text-slate-900">¿Sigues con dudas?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Consulta con el personal en el mostrador o escríbenos por WhatsApp al {LIBRARY.whatsapp.texto}.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {!esKiosco ? (
              <a
                href={ENLACE_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-action px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-action-dark"
              >
                Escribir por WhatsApp
              </a>
            ) : null}
            <Link to="/horarios" className="inline-flex rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:border-primary">
              Horarios y contacto
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}
