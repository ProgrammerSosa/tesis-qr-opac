import { Armchair, BookOpen, FileCheck2, FilePlus2, Globe, Quote } from 'lucide-react';

// Los servicios de la biblioteca: se muestran en el menú, en el inicio y en la página de servicios.
// `resumen` es la frase corta de las tarjetas; `detalle` explica el servicio en la página de servicios.
export const SERVICIOS = [
  {
    clave: 'catalogo',
    to: '/catalogo',
    titulo: 'Catálogo de tesis',
    icono: BookOpen,
    acento: 'blue',
    accion: 'Buscar tesis',
    resumen: 'Busca por autor, título, año o tema las tesis de grado y posgrado de la Facultad y consulta su ficha.',
    detalle:
      'El catálogo reúne las tesis de grado, de posgrado, doctorales y los seminarios de la Facultad. Cada ficha indica dónde está el ejemplar y, cuando existe, permite consultar o descargar el documento digital.',
  },
  {
    clave: 'sala',
    to: '/sala-de-estudio',
    titulo: 'Reserva de cubículos y sala de estudio',
    tituloCorto: 'Sala de estudio',
    icono: Armchair,
    acento: 'red',
    accion: 'Reservar un lugar',
    resumen: 'Cubículos con internet para trabajar en grupo, estaciones individuales y sillas en la sala de lectura.',
    detalle:
      'Elige el día, la hora y toca un lugar libre en el plano. Los cubículos 1 a 4 sirven para preparar fases (de 4 a 8 horas) y los cubículos 5 y 6 para estudio regular (bloques de 2 horas). Al terminar recibes un comprobante.',
  },
  {
    clave: 'solvencia',
    to: '/solvencia',
    titulo: 'Solvencia de biblioteca',
    icono: FileCheck2,
    acento: 'blue',
    accion: 'Solicitar solvencia',
    resumen: 'Pide tu solvencia electrónica (paz y salvo bibliotecario) con tu orden de pago y recíbela por correo.',
    detalle:
      'Servicio para estudiantes de la Facultad del Campus Central. Pagas la orden de pago, llenas la solicitud con por lo menos un día de anticipación y recibes la solvencia en PDF en tu correo, en el horario de entrega que corresponda.',
  },
  {
    clave: 'tesis-digital',
    to: '/tesis-digital',
    titulo: 'Tesis en formato digital',
    icono: FilePlus2,
    acento: 'red',
    accion: 'Solicitar una tesis',
    resumen: 'Pide que la biblioteca publique en el repositorio una tesis que aún no está disponible en digital.',
    detalle:
      'Puedes solicitar las tesis de grado desde el año 2010 y las de posgrado desde el año 2016. Cuando la tesis queda publicada en el repositorio, la biblioteca te avisa por correo.',
  },
  {
    clave: 'referencias',
    to: '/referencias',
    titulo: 'Referencias bibliográficas',
    icono: Quote,
    acento: 'blue',
    accion: 'Pedir una referencia',
    resumen: 'Las bibliotecólogas te ayudan con la referencia de la fuente que necesitas para tu investigación.',
    detalle:
      'Indica el tema y la fuente de la que necesitas la referencia. La respuesta llega a tu correo en un máximo de 24 horas hábiles.',
  },
  {
    clave: 'recursos',
    to: '/recursos',
    titulo: 'Recursos de investigación',
    icono: Globe,
    acento: 'red',
    accion: 'Ver recursos',
    resumen: 'Biblioteca virtual de la UNAM, normas APA y revistas de acceso abierto para apoyar tu investigación.',
    detalle:
      'Una selección de bibliotecas virtuales, revistas científicas y repositorios de tesis de acceso libre, recomendados por la biblioteca.',
  },
];

// Menú principal del sitio público.
export const MENU = [
  { to: '/', etiqueta: 'Inicio', exacto: true },
  { to: '/catalogo', etiqueta: 'Catálogo' },
  { etiqueta: 'Servicios', subMenu: true },
  { to: '/horarios', etiqueta: 'Horarios' },
  { to: '/recursos', etiqueta: 'Recursos' },
  { to: '/quienes-somos', etiqueta: 'Quiénes somos' },
];

// Enlaces del pie de página (además de los servicios).
export const ENLACES_DE_LA_BIBLIOTECA = [
  { to: '/quienes-somos', etiqueta: 'Quiénes somos' },
  { to: '/horarios', etiqueta: 'Horarios y contacto' },
  { to: '/preguntas-frecuentes', etiqueta: 'Preguntas frecuentes' },
  { to: '/recursos', etiqueta: 'Recursos de investigación' },
  { to: '/privacidad', etiqueta: 'Privacidad de tus datos' },
];
