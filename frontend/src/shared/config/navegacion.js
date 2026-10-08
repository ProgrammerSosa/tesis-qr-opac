import { Armchair, BookOpen, DoorOpen, FileCheck2 } from 'lucide-react';

// Los cuatro servicios del kiosco (propuesta, sección 4.5): OPAC, reservar cubículo, reservar espacio de estudio y
// formulario de solicitud de solvencia. Son las opciones de la pantalla inicial y del menú.
export const SERVICIOS = [
  {
    clave: 'opac',
    to: '/catalogo',
    titulo: 'Catálogo de tesis (OPAC)',
    tituloCorto: 'Catálogo',
    icono: BookOpen,
    acento: 'blue',
    accion: 'Buscar',
    resumen: 'Busca por autor, título, tema o tipo de documento. Consulta la ficha y, si existe, el documento digital.',
  },
  {
    clave: 'cubiculo',
    to: '/sala-de-estudio?zona=cubiculos',
    titulo: 'Reservar cubículo',
    tituloCorto: 'Cubículos',
    icono: DoorOpen,
    acento: 'red',
    accion: 'Reservar',
    resumen: 'Elige el día, la hora y el cubículo para trabajar en grupo. Al terminar recibes tu comprobante.',
  },
  {
    clave: 'espacio',
    to: '/sala-de-estudio?zona=estaciones',
    titulo: 'Reservar espacio de estudio',
    tituloCorto: 'Espacios de estudio',
    icono: Armchair,
    acento: 'blue',
    accion: 'Reservar',
    resumen: 'Estaciones individuales y lugares de la sala de lectura, según la fecha y el horario que elijas.',
  },
  {
    clave: 'solvencia',
    to: '/solvencia',
    titulo: 'Solicitud de solvencia',
    tituloCorto: 'Solvencia',
    icono: FileCheck2,
    acento: 'red',
    accion: 'Solicitar',
    resumen: 'Llena el formulario, revisa tus datos y recibe la confirmación de tu solicitud.',
  },
];

// Menú principal del sitio. La reserva de cubículos y de espacios comparte pantalla (sala de estudio).
export const MENU = [
  { to: '/', etiqueta: 'Inicio', exacto: true },
  { to: '/catalogo', etiqueta: 'Catálogo' },
  { to: '/sala-de-estudio', etiqueta: 'Reservas' },
  { to: '/solvencia', etiqueta: 'Solvencia' },
];
