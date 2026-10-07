import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import Page from '../../shared/components/Page';
import { SERVICIOS } from '../../shared/config/navegacion';

// Qué incluye cada servicio, en pocas líneas. El detalle de cada trámite está en su propia página.
const PUNTOS = {
  catalogo: [
    'Búsqueda por autor, título, año, tema y tipo de documento.',
    'Ficha con la ubicación del ejemplar, vistas MARC e ISBD y el código QR de la etiqueta.',
    'Documento digital para consultar en línea o descargar, según su nivel de acceso.',
  ],
  sala: [
    'Cubículos 1 a 4 para preparar fases: reservas de 4 a 8 horas por día.',
    'Cubículos 5 y 6 para estudio regular: bloques de 2 horas, hasta 4 horas por día.',
    'Estaciones individuales y sillas de la sala de lectura, por una hora.',
  ],
  solvencia: [
    'Para estudiantes de la Facultad de Ciencias Jurídicas y Sociales del Campus Central.',
    'Se solicita con 24 horas de anticipación como mínimo y 7 días como máximo.',
    'La solvencia llega a tu correo en PDF, en el horario de entrega que corresponde.',
  ],
  'tesis-digital': [
    'Tesis de grado desde el año 2010 y de posgrado desde el año 2016.',
    'Indicas la clasificación, el autor y el título que ves en el catálogo.',
    'Te avisamos por correo cuando la tesis ya se puede consultar en el repositorio.',
  ],
  referencias: [
    'Indicas el tema y la fuente de la que necesitas la referencia.',
    'Te atienden las bibliotecólogas de la biblioteca.',
    'La respuesta llega a tu correo en 24 horas hábiles.',
  ],
  recursos: [
    'Biblioteca Jurídica Virtual de la UNAM, de acceso libre y gratuito.',
    'Normas APA, GOALI, Dialnet, Redalyc, SciELO y revistas jurídicas.',
    'Repositorios de tesis de grado y posgrado de la Facultad.',
  ],
};

export default function ServiciosPage() {
  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Servicios' }]}
      title="Servicios de la biblioteca"
      subtitle="Todo lo que puedes hacer en línea o en la biblioteca, explicado en pocas palabras."
    >
      <ul className="flex flex-col gap-6">
        {SERVICIOS.map(({ clave, to, titulo, icono: Icono, acento, accion, detalle }) => (
          <li key={clave}>
            <article className="grid gap-6 rounded-2xl border border-border bg-white p-6 shadow-card md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-8 md:p-8">
              <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${acento === 'red' ? 'bg-red-50 text-action' : 'bg-blue-50 text-primary'}`}>
                <Icono size={30} strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold text-slate-900">{titulo}</h2>
                <p className="mt-2 text-base leading-relaxed text-slate-600">{detalle}</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {(PUNTOS[clave] ?? []).map((punto) => (
                    <li key={punto} className="flex gap-2.5 text-sm text-slate-700">
                      <Check size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                      {punto}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to={to}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-action px-6 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-action-dark"
              >
                {accion}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </Page>
  );
}
