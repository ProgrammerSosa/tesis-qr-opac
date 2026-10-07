import { Link } from 'react-router-dom';
import { BookOpen, Eye, Flag, History, MapPin, QrCode, ScanLine, Target, Users } from 'lucide-react';
import Page from '../../shared/components/Page';
import SectionHeading from '../../shared/components/SectionHeading';
import { LIBRARY } from '../../shared/config/library';

const LINEA_DE_TIEMPO = [
  {
    fecha: 'Noviembre de 1979',
    texto:
      'El Consejo Superior Universitario (Acta 43-79) ordena descentralizar las colecciones: los libros vuelven a las bibliotecas especializadas de cada unidad académica.',
  },
  {
    fecha: '1983',
    texto:
      'El material bibliográfico de las Ciencias Jurídicas y Sociales regresa a la Facultad, que le asigna un espacio en el edificio S-5 para su resguardo y préstamo. Se habilita una sala de lectura con capacidad para 40 usuarios.',
  },
  {
    fecha: '30 de abril de 1984',
    texto:
      'La Junta Directiva de la Facultad (Punto Octavo del Acta 11-84) da a la biblioteca el nombre del ex decano Lic. Francisco Rolando Velázquez González.',
  },
];

const EQUIPO = [
  { area: 'Jefatura', texto: 'Dirige la biblioteca, coordina al personal y las decisiones sobre las colecciones y los servicios.' },
  { area: 'Circulación y préstamo', texto: 'Atiende el mostrador: préstamo de material, solvencias, reservas de lugares y referencias bibliográficas.' },
  { area: 'Tesis', texto: 'Cuida la colección de tesis, atiende las solicitudes de tesis en formato digital y mantiene el repositorio.' },
  { area: 'Apoyo administrativo', texto: 'Da soporte a los trámites y a la atención diaria de la biblioteca.' },
];

const MODERNIZACION = [
  { icono: BookOpen, titulo: 'Catálogo en línea (OPAC)', texto: 'Cada tesis tiene su ficha con ubicación, datos del ejemplar y, cuando existe, su documento digital.' },
  { icono: QrCode, titulo: 'Etiqueta QR en cada tesis', texto: 'Un código en la contraportada lleva desde el ejemplar físico a su ficha en el catálogo.' },
  { icono: ScanLine, titulo: 'Kioscos de autoservicio', texto: 'Pantallas táctiles en la biblioteca para consultar el catálogo, reservar y hacer trámites sin esperar.' },
];

export default function QuienesSomosPage() {
  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Quiénes somos' }]}
      title="Quiénes somos"
      subtitle={`${LIBRARY.nombre}, de la ${LIBRARY.facultad} de la ${LIBRARY.universidad}.`}
      ancho="lectura"
    >
      <div className="flex flex-col gap-14">
        <section aria-labelledby="historia-titulo" className="flex flex-col gap-6">
          <SectionHeading etiqueta="Nuestra historia">
            <span id="historia-titulo">De las colecciones centrales a una biblioteca de la Facultad</span>
          </SectionHeading>
          <ol className="relative flex flex-col gap-6 border-l-2 border-border pl-8">
            {LINEA_DE_TIEMPO.map((hito) => (
              <li key={hito.fecha} className="relative">
                <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-action shadow" aria-hidden="true" />
                <p className="flex items-center gap-2 text-sm font-bold text-action">
                  <History size={15} aria-hidden="true" />
                  {hito.fecha}
                </p>
                <p className="mt-1 text-base leading-relaxed text-slate-700">{hito.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Misión y visión" className="grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-border border-t-4 border-t-primary bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
              <Target size={22} className="text-primary" aria-hidden="true" />
              Misión
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              Gestionar la adquisición de material bibliográfico sobre las Ciencias Jurídicas y Sociales y áreas afines,
              conservarlo clasificado para encontrarlo con rapidez y satisfacer las necesidades de información de nuestros
              usuarios, apoyando así la misión general de la Universidad de San Carlos de Guatemala.
            </p>
          </article>
          <article className="rounded-2xl border border-border border-t-4 border-t-action bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-slate-900">
              <Eye size={22} className="text-action" aria-hidden="true" />
              Visión
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              Ser un órgano auxiliar importante en la enseñanza, la investigación y el aprendizaje, y un centro que difunde el
              conocimiento contenido en los documentos de nuestro acervo, en apoyo a la docencia que imparte la Universidad
              de San Carlos de Guatemala.
            </p>
          </article>
        </section>

        <section aria-labelledby="equipo-titulo" className="flex flex-col gap-6">
          <SectionHeading etiqueta="Nuestro equipo" descripcion="Estas son las áreas que te atienden en el mostrador y en línea.">
            <span id="equipo-titulo">Personal de la biblioteca</span>
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2">
            {EQUIPO.map((area) => (
              <li key={area.area} className="flex gap-4 rounded-xl border border-border bg-white p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  <Users size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900">{area.area}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{area.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="moderna-titulo" className="rounded-2xl bg-ink p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Modernización</p>
          <h2 id="moderna-titulo" className="mt-1.5 font-display text-2xl font-semibold">
            {LIBRARY.lema}
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/75">
            Este sitio forma parte de la modernización de la biblioteca: llevar el catálogo y los trámites a donde están los
            estudiantes, sin perder el cuidado de la colección impresa.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {MODERNIZACION.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <Icono size={24} className="text-blue-300" aria-hidden="true" />
                <h3 className="mt-3 font-bold">{titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ubicacion-titulo" className="flex flex-col gap-4">
          <SectionHeading etiqueta="Ubicación">
            <span id="ubicacion-titulo">Nuestra ubicación</span>
          </SectionHeading>
          <div className="flex gap-4 rounded-2xl border border-border bg-white p-6 shadow-card">
            <Flag size={24} className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
            <div>
              <p className="text-base leading-relaxed text-slate-700">{LIBRARY.direccion}.</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin size={15} aria-hidden="true" />
                {LIBRARY.ubicacion}
              </p>
              <Link to="/horarios" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
                Ver horarios y contacto →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}
