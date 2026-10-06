import { useCallback, useEffect, useState } from 'react';
import { BookMarked, CalendarCheck, ChartColumn, Clock, FileCheck2, FileText, LogOut, QrCode, ShieldCheck, Users } from 'lucide-react';
import { adminApi } from './adminApi';
import { authApi } from './authApi';
import LoginForm from './LoginForm';
import ReservasPanel from './ReservasPanel';
import SolicitudesPanel from './SolicitudesPanel';
import UsuariosPanel from './UsuariosPanel';
import TesisDigitalesPanel from './TesisDigitalesPanel';
import CodigosQrPanel from './CodigosQrPanel';
import EstadisticasPanel from './EstadisticasPanel';
import { EVENTO_SESION_EXPIRADA } from '../../shared/api/axiosClient';
import { borrarSesion, guardarSesion, leerSesion } from '../../shared/auth/sesion';
import StatTile from '../../shared/components/StatTile';
import PageHeader from '../../shared/components/PageHeader';

// Qué rol ve qué sección (propuesta, sección 4.5.6). El servidor repite la comprobación en cada petición:
// ocultar una pestaña es comodidad, no seguridad.
const SECCIONES = [
  { clave: 'reservas', etiqueta: 'Reservas', icono: CalendarCheck, roles: ['administrador', 'circulacion'], Panel: ReservasPanel },
  { clave: 'solicitudes', etiqueta: 'Solicitudes', icono: FileCheck2, roles: ['administrador', 'circulacion'], Panel: SolicitudesPanel },
  { clave: 'usuarios', etiqueta: 'Usuarios', icono: Users, roles: ['administrador', 'circulacion'], Panel: UsuariosPanel },
  { clave: 'tesis', etiqueta: 'Tesis digitales', icono: FileText, roles: ['administrador', 'tesis'], Panel: TesisDigitalesPanel },
  { clave: 'qr', etiqueta: 'Códigos QR', icono: QrCode, roles: ['administrador', 'tesis'], Panel: CodigosQrPanel },
  { clave: 'estadisticas', etiqueta: 'Estadísticas', icono: ChartColumn, roles: ['administrador', 'consulta'], Panel: EstadisticasPanel },
];

const AVISO_SESION_TERMINADA = 'Tu sesión terminó. Inicia sesión de nuevo para continuar.';

export default function AdminDashboardPage() {
  const [sesion, setSesion] = useState(leerSesion);
  const [aviso, setAviso] = useState('');
  const [seccion, setSeccion] = useState(null);
  const [resumen, setResumen] = useState(null);

  // El cliente de la API avisa cuando el servidor deja de reconocer la sesión (venció o el servidor se reinició).
  useEffect(() => {
    const alExpirar = () => {
      setSesion(null);
      setResumen(null);
      setAviso(AVISO_SESION_TERMINADA);
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const cargarResumen = useCallback(() => {
    adminApi
      .resumen()
      .then((res) => setResumen(res.data.data))
      .catch(() => setResumen(null)); // un resumen que no carga no debe tapar el panel; si la sesión venció, el aviso la cierra
  }, []);

  useEffect(() => {
    if (sesion) cargarResumen();
  }, [sesion, cargarResumen]);

  function alEntrar(nueva) {
    guardarSesion(nueva);
    setAviso('');
    setSeccion(null);
    setSesion(nueva);
  }

  async function cerrarSesion() {
    try {
      await authApi.logout();
    } catch {
      // si el servidor ya no la reconoce, igual se cierra aquí
    }
    borrarSesion();
    setSesion(null);
    setResumen(null);
    setAviso('');
  }

  if (!sesion) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          crumbs={[{ label: 'Inicio', to: '/' }, { label: 'Panel del personal' }]}
          title="Panel del personal"
          subtitle="Reservas, solicitudes, tesis digitales, códigos QR y estadísticas. Se necesita una cuenta autorizada."
        />
        <LoginForm aviso={aviso} onEntrar={alEntrar} />
      </div>
    );
  }

  const permitidas = SECCIONES.filter((s) => s.roles.includes(sesion.rol));
  const activa = permitidas.find((s) => s.clave === seccion) ?? permitidas[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: 'Inicio', to: '/' }, { label: 'Panel del personal' }]}
        title="Panel del personal"
        subtitle={`Secciones disponibles para tu rol: ${permitidas.map((s) => s.etiqueta).join(', ')}.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm text-slate-700">
          <ShieldCheck size={16} className="text-primary" />
          <span>
            <b>{sesion.nombre}</b> · {sesion.rolNombre}
          </span>
        </p>
        <button
          type="button"
          onClick={cerrarSesion}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>

      {resumen ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Tesis registradas" value={resumen.tesis.total} icon={BookMarked} />
          <StatTile label="Con documento digital" value={resumen.tesis.conDocumentoDigital} icon={FileText} />
          <StatTile label="Reservas activas" value={resumen.reservas.activas} icon={Clock} />
          <StatTile label="Reservas hoy" value={resumen.reservas.hoy} icon={CalendarCheck} />
          <StatTile label="Solvencias pendientes" value={resumen.solvencia.pendientes} icon={FileCheck2} />
        </div>
      ) : null}

      <div>
        <div role="tablist" aria-label="Secciones del panel" className="flex flex-wrap gap-1 border-b border-border">
          {permitidas.map((s) => (
            <button
              key={s.clave}
              role="tab"
              aria-selected={activa.clave === s.clave}
              onClick={() => setSeccion(s.clave)}
              className={`-mb-px inline-flex items-center gap-2 rounded-t-md border px-4 py-2.5 text-sm transition-colors ${
                activa.clave === s.clave
                  ? 'border-border border-b-white border-t-2 border-t-action bg-white font-semibold text-slate-900'
                  : 'border-transparent text-primary hover:bg-surface'
              }`}
            >
              <s.icono size={16} />
              {s.etiqueta}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="pt-5">
          <activa.Panel key={activa.clave} onCambio={cargarResumen} />
        </div>
      </div>
    </div>
  );
}
