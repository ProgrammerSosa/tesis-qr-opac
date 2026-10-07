import {
  BookMarked,
  CalendarCheck,
  CalendarClock,
  ChartColumn,
  FileCheck2,
  FileText,
  History,
  LayoutDashboard,
  Mail,
  Megaphone,
  QrCode,
  SlidersHorizontal,
  UserCog,
  Users,
  FilePlus2,
} from 'lucide-react';

const TODOS = ['administrador', 'circulacion', 'tesis', 'consulta'];
const CIRCULACION = ['administrador', 'circulacion'];
const TESIS = ['administrador', 'tesis'];

// Secciones de la consola del personal (propuesta, sección 4.5.6) y qué roles entran a cada una.
// El servidor repite la comprobación en cada petición: ocultar una sección es comodidad, no seguridad.
// `clave` es también la dirección de la sección: /admin/<clave>.
export const GRUPOS = ['Atención', 'Acervo', 'Sitio público', 'Análisis', 'Administración'];

export const SECCIONES = [
  { clave: 'resumen', etiqueta: 'Resumen', titulo: 'Resumen del día', icono: LayoutDashboard, grupo: null, roles: TODOS },
  { clave: 'reservas', etiqueta: 'Reservas', titulo: 'Reservas de cubículos y espacios', icono: CalendarCheck, grupo: 'Atención', roles: CIRCULACION },
  { clave: 'solicitudes', etiqueta: 'Solvencias', titulo: 'Solicitudes de solvencia', icono: FileCheck2, grupo: 'Atención', roles: CIRCULACION },
  {
    clave: 'tramites',
    etiqueta: 'Tesis y referencias',
    titulo: 'Solicitudes de tesis digitales y referencias',
    icono: FilePlus2,
    grupo: 'Atención',
    roles: ['administrador', 'circulacion', 'tesis'],
  },
  { clave: 'usuarios', etiqueta: 'Usuarios', titulo: 'Usuarios de la biblioteca', icono: Users, grupo: 'Atención', roles: CIRCULACION },
  { clave: 'catalogo', etiqueta: 'Catálogo', titulo: 'Catálogo de tesis', icono: BookMarked, grupo: 'Acervo', roles: TESIS },
  { clave: 'tesis', etiqueta: 'Tesis digitales', titulo: 'Documentos digitales de las tesis', icono: FileText, grupo: 'Acervo', roles: TESIS },
  { clave: 'qr', etiqueta: 'Códigos QR', titulo: 'Códigos QR de las tesis', icono: QrCode, grupo: 'Acervo', roles: TESIS },
  { clave: 'avisos', etiqueta: 'Avisos', titulo: 'Avisos para el público', icono: Megaphone, grupo: 'Sitio público', roles: CIRCULACION },
  { clave: 'horarios', etiqueta: 'Horarios y cierres', titulo: 'Horarios y días de cierre', icono: CalendarClock, grupo: 'Sitio público', roles: ['administrador'] },
  { clave: 'estadisticas', etiqueta: 'Estadísticas', titulo: 'Estadísticas de uso', icono: ChartColumn, grupo: 'Análisis', roles: ['administrador', 'consulta'] },
  { clave: 'personal', etiqueta: 'Cuentas del personal', titulo: 'Cuentas del personal', icono: UserCog, grupo: 'Administración', roles: ['administrador'] },
  { clave: 'configuracion', etiqueta: 'Configuración', titulo: 'Configuración general', icono: SlidersHorizontal, grupo: 'Administración', roles: ['administrador'] },
  { clave: 'correos', etiqueta: 'Correos enviados', titulo: 'Correos enviados por el sistema', icono: Mail, grupo: 'Administración', roles: ['administrador'] },
  { clave: 'actividad', etiqueta: 'Actividad', titulo: 'Actividad del personal', icono: History, grupo: 'Administración', roles: ['administrador'] },
];

export function seccionesDe(rol) {
  return SECCIONES.filter((s) => s.roles.includes(rol));
}

export function puedeVer(rol, clave) {
  return SECCIONES.some((s) => s.clave === clave && s.roles.includes(rol));
}
