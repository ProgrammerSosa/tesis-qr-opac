import { Link, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AdminLoginPage from './AdminLoginPage';
import { SECCIONES, puedeVer } from './secciones';
import { useSesionAdmin } from './SesionAdmin';
import ActividadPage from './paginas/ActividadPage';
import AvisosPage from './paginas/AvisosPage';
import CatalogoPage from './paginas/CatalogoPage';
import CodigosQrPage from './paginas/CodigosQrPage';
import ConfiguracionPage from './paginas/ConfiguracionPage';
import CorreosPage from './paginas/CorreosPage';
import EstadisticasPage from './paginas/EstadisticasPage';
import HorariosPage from './paginas/HorariosPage';
import PersonalPage from './paginas/PersonalPage';
import ReservasPage from './paginas/ReservasPage';
import ResumenPage from './paginas/ResumenPage';
import SolicitudesPage from './paginas/SolicitudesPage';
import TesisDigitalesPage from './paginas/TesisDigitalesPage';
import TramitesPage from './paginas/TramitesPage';
import UsuariosPage from './paginas/UsuariosPage';

const PAGINAS = {
  resumen: ResumenPage,
  reservas: ReservasPage,
  solicitudes: SolicitudesPage,
  tramites: TramitesPage,
  usuarios: UsuariosPage,
  catalogo: CatalogoPage,
  tesis: TesisDigitalesPage,
  qr: CodigosQrPage,
  avisos: AvisosPage,
  horarios: HorariosPage,
  estadisticas: EstadisticasPage,
  personal: PersonalPage,
  configuracion: ConfiguracionPage,
  correos: CorreosPage,
  actividad: ActividadPage,
};

function Aviso({ titulo, children }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 rounded-lg border border-border bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
      <p className="text-sm text-slate-600">{children}</p>
      <Link to="/admin/resumen" className="mt-1 text-sm font-semibold text-primary hover:underline">
        Ir al resumen
      </Link>
    </div>
  );
}

// Una sección solo se abre si el rol de la sesión puede verla; si no, se explica en vez de mostrar una pantalla rota.
function Seccion({ clave }) {
  const { sesion } = useSesionAdmin();
  const Pagina = PAGINAS[clave];
  if (!puedeVer(sesion.rol, clave)) {
    return <Aviso titulo="Sin permiso">Tu rol no tiene acceso a esta sección. Si la necesitas, pídela a la administración.</Aviso>;
  }
  return <Pagina />;
}

// La consola del personal, que vive aparte del sitio público: tiene su propio diseño, su propio inicio de sesión y
// sus propias direcciones (/admin/...). El sitio público no enlaza a ella y ella no usa nada de su diseño.
export default function AdminApp() {
  return (
    <Routes>
      <Route path="acceso" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/resumen" replace />} />
        {SECCIONES.map((s) => (
          <Route key={s.clave} path={s.clave} element={<Seccion clave={s.clave} />} />
        ))}
        <Route path="*" element={<Aviso titulo="Esta sección no existe">Revisa la dirección o vuelve al resumen.</Aviso>} />
      </Route>
    </Routes>
  );
}
