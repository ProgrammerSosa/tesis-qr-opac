import { Link } from 'react-router-dom';
import { ArrowUpRight, BookMarked, Globe, GraduationCap, Library, Newspaper, ScrollText } from 'lucide-react';
import Nota from '../../shared/components/Nota';
import Page from '../../shared/components/Page';
import SectionHeading from '../../shared/components/SectionHeading';
import EnlaceExterno from '../../shared/components/EnlaceExterno';
import { ENLACES_EXTERNOS, LIBRARY } from '../../shared/config/library';
import { useKiosco } from '../../shared/kiosco/KioscoContext';

// Recursos de otras instituciones que recomienda la biblioteca. Los textos resumen lo que cada sitio ofrece.
const GRUPOS = [
  {
    clave: 'tesis',
    etiqueta: 'Tesis y libros de la Facultad',
    titulo: 'Repositorios de la biblioteca',
    descripcion: 'Además de este catálogo, la biblioteca mantiene repositorios en línea con documentos a texto completo.',
    recursos: [
      {
        titulo: 'Tesis de grado',
        icono: GraduationCap,
        href: ENLACES_EXTERNOS.tesisGrado,
        texto: 'Consulta a texto completo o descarga en PDF las tesis de grado de estudiantes de la Facultad. El repositorio crece por etapas hasta reunir toda la colección.',
      },
      {
        titulo: 'Tesis de posgrado',
        icono: ScrollText,
        href: ENLACES_EXTERNOS.tesisPosgrado,
        texto: 'Trabajos de quienes obtuvieron el grado de maestría o doctorado en la Facultad, organizados por año de publicación, título y autor.',
      },
      {
        titulo: 'Catálogo electrónico de libros',
        icono: Library,
        href: ENLACES_EXTERNOS.catalogoDeLibros,
        texto: 'Busca los libros de la biblioteca para solicitar el material bibliográfico que necesitas en tu investigación.',
      },
    ],
  },
  {
    clave: 'virtual',
    etiqueta: 'Biblioteca virtual',
    titulo: 'Acceso libre y gratuito',
    descripcion: 'Libros, revistas y otros materiales jurídicos a texto completo.',
    recursos: [
      {
        titulo: 'Biblioteca Jurídica Virtual de la UNAM',
        icono: BookMarked,
        href: ENLACES_EXTERNOS.bibliotecaUnam,
        texto: 'Del Instituto de Investigaciones Jurídicas de la UNAM: libros, revistas y otros materiales en texto completo, de acceso gratuito desde 2001.',
      },
    ],
  },
  {
    clave: 'fuentes',
    etiqueta: 'Fuentes externas',
    titulo: 'Apoyo a la investigación',
    descripcion: 'Sitios alternos y complementarios para fundamentar tesis e investigaciones.',
    recursos: [
      {
        titulo: 'Normas APA',
        icono: Newspaper,
        href: 'https://normas-apa.org/',
        texto: 'Material para presentar y citar tu trabajo académico con las normas APA más actualizadas.',
      },
      {
        titulo: 'GOALI',
        icono: Globe,
        href: 'http://goali.ilo.org/content/es/journals.php',
        texto: 'Acceso global en línea a información jurídica: investigaciones y formación en derecho, gratis o a costo reducido para países en desarrollo.',
      },
      {
        titulo: 'Dialnet',
        icono: Newspaper,
        href: 'https://dialnet.unirioja.es/',
        texto: 'Hemeroteca virtual de acceso libre con índices de revistas científicas de España, Portugal y Latinoamérica, además de libros, tesis doctorales y congresos.',
      },
      {
        titulo: 'Revista Laborem',
        icono: ScrollText,
        href: 'https://laborem.spdtss.org.pe/index.php/laborem',
        texto: 'Publicación de la Sociedad Peruana de Derecho del Trabajo y de la Seguridad Social, con acceso gratuito a doctrina y análisis de jurisprudencia.',
      },
      {
        titulo: 'Redalyc',
        icono: Globe,
        href: 'https://www.redalyc.org/',
        texto: 'Hemeroteca científica de acceso abierto de Iberoamérica: artículos completos y gratuitos de revistas arbitradas, con referencias automáticas.',
      },
      {
        titulo: 'SciELO',
        icono: Library,
        href: 'https://www.scielo.org/es/',
        texto: 'Red de bibliotecas virtuales con revistas científicas de América Latina, España y Portugal, revisadas por pares y a texto completo.',
      },
    ],
  },
];

function TarjetaDeRecurso({ recurso }) {
  const { esKiosco } = useKiosco();
  const Icono = recurso.icono;
  const contenido = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Icono size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-start justify-between gap-2 text-base font-bold text-slate-900 group-hover:text-primary">
          {recurso.titulo}
          {!esKiosco ? <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-slate-400 group-hover:text-primary" aria-hidden="true" /> : null}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{recurso.texto}</p>
        {esKiosco ? <p className="mt-2 break-all font-mono text-xs text-slate-500">{recurso.href.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p> : null}
      </div>
    </>
  );
  const clases = 'group flex h-full gap-4 rounded-2xl border border-border bg-white p-5 shadow-card transition-all';

  return esKiosco ? (
    <div className={clases}>{contenido}</div>
  ) : (
    <a href={recurso.href} target="_blank" rel="noopener noreferrer" className={`${clases} hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift`}>
      {contenido}
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  );
}

export default function RecursosPage() {
  const { esKiosco } = useKiosco();

  return (
    <Page
      crumbs={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Recursos de investigación' }]}
      title="Recursos de investigación"
      subtitle="Bibliotecas virtuales, revistas y repositorios de acceso libre que recomienda la biblioteca para apoyar tu investigación."
    >
      <div className="flex flex-col gap-12">
        {esKiosco ? (
          <Nota tono="info">
            Estos sitios se abren desde un computador o un teléfono. Anota la dirección que te interese; en este kiosco no se pueden abrir.
          </Nota>
        ) : null}

        {GRUPOS.map((grupo) => (
          <section key={grupo.clave} aria-labelledby={`recursos-${grupo.clave}`} className="flex flex-col gap-6">
            <SectionHeading etiqueta={grupo.etiqueta} descripcion={grupo.descripcion}>
              <span id={`recursos-${grupo.clave}`}>{grupo.titulo}</span>
            </SectionHeading>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {grupo.recursos.map((recurso) => (
                <li key={recurso.titulo}>
                  <TarjetaDeRecurso recurso={recurso} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface p-6">
          <p className="max-w-xl text-base text-slate-700">
            ¿No encuentras lo que buscas? Pide a las bibliotecólogas una{' '}
            <Link to="/referencias" className="font-bold text-primary hover:underline">
              referencia bibliográfica
            </Link>{' '}
            o busca en el{' '}
            <Link to="/catalogo" className="font-bold text-primary hover:underline">
              catálogo de tesis
            </Link>
            .
          </p>
          <EnlaceExterno href={LIBRARY.redes.blog} className="inline-flex rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:border-primary">
            Blog de la biblioteca
          </EnlaceExterno>
        </div>
      </div>
    </Page>
  );
}
