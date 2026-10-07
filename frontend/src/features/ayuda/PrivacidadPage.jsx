import { Link } from 'react-router-dom';
import Page from '../../shared/components/Page';
import { LIBRARY } from '../../shared/config/library';

const SECCIONES = [
  {
    titulo: 'Qué datos pedimos y para qué',
    contenido: (
      <>
        <p>Solo pedimos los datos que cada servicio necesita para atenderte:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <b>Reserva de un lugar de estudio:</b> tu nombre, tu carné, correo institucional o documento y, si quieres el comprobante por correo, tu correo.
          </li>
          <li>
            <b>Solvencia:</b> tu nombre, carné, CUI, programa académico, correo, número de orden de pago y la fecha en que presentarás tu papelería.
          </li>
          <li>
            <b>Tesis en formato digital y referencias bibliográficas:</b> tu nombre, tu correo y los datos de la tesis o de la fuente que necesitas.
          </li>
        </ul>
      </>
    ),
  },
  {
    titulo: 'Quién los ve',
    contenido: (
      <p>
        Los datos de una solicitud solo los ve el personal de la biblioteca que la atiende, y se usan únicamente para atenderla y para avisarte por correo
        cómo va. No los vendemos ni los compartimos con terceros.
      </p>
    ),
  },
  {
    titulo: 'Correos que recibirás',
    contenido: (
      <p>
        Cuando haces una solicitud, te enviamos un correo de confirmación y otro cuando el personal la atiende o la rechaza (con el motivo). No usamos tu
        correo para publicidad.
      </p>
    ),
  },
  {
    titulo: 'Kioscos de la biblioteca',
    contenido: (
      <p>
        En los kioscos, la pantalla se limpia al terminar una operación y la sesión se cierra sola cuando nadie la usa durante un minuto y medio. Así, la
        persona siguiente no ve lo que escribiste. Aun así, al terminar, cierra tu trabajo y no dejes tu comprobante a la vista.
      </p>
    ),
  },
  {
    titulo: 'Estadísticas de uso',
    contenido: (
      <p>
        Para saber qué servicios se usan más, el sistema cuenta eventos como búsquedas, reservas, consultas y descargas de documentos. Estos conteos no
        incluyen tu nombre ni tus datos personales.
      </p>
    ),
  },
  {
    titulo: 'Cuánto tiempo se guardan y cómo corregirlos',
    contenido: (
      <p>
        Las solicitudes se conservan mientras la biblioteca las necesite para su gestión y su historial. Si quieres corregir o pedir que se elimine una
        solicitud, comunícate con la biblioteca: en el <Link to="/horarios" className="font-semibold text-primary hover:underline">mostrador o por WhatsApp</Link> te
        ayudamos.
      </p>
    ),
  },
];

export default function PrivacidadPage() {
  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Privacidad' }]}
      title="Privacidad de tus datos"
      subtitle={`Qué información recopila la ${LIBRARY.nombreCorto} cuando usas este sitio y cómo la cuida.`}
      ancho="lectura"
    >
      <div className="flex flex-col gap-8">
        {SECCIONES.map(({ titulo, contenido }) => (
          <section key={titulo} className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-slate-900">{titulo}</h2>
            <div className="mt-3 text-base leading-relaxed text-slate-700">{contenido}</div>
          </section>
        ))}
      </div>
    </Page>
  );
}
