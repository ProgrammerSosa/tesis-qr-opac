import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { adminApi } from '../adminApi';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { fechaLegible } from '../estados';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Nota from '../../../shared/components/Nota';

// Qué guarda cada documento, dicho para quien no conoce el sistema por dentro.
const DOCUMENTOS = {
  catalogo: ['Catálogo de tesis', 'Las tesis, su documento digital y la configuración de su código QR'],
  reservas: ['Reservas', 'Cubículos, estaciones y sillas de la sala de lectura'],
  solvencia: ['Solicitudes de solvencia', 'Con los datos que dejó cada estudiante'],
  cuentas: ['Cuentas del personal', 'Los usuarios del panel (sus claves se guardan cifradas)'],
  horarios: ['Horarios y cierres', 'Las horas de reserva de cada día y los días de cierre'],
  configuracion: ['Configuración', 'Tolerancia, topes de horas y reservas pausadas'],
  actividad: ['Actividad del personal', 'Qué hizo cada persona en el panel'],
  eventos: ['Uso del sitio y de los kioscos', 'Búsquedas, accesos por QR y sesiones (alimentan las estadísticas)'],
  sesiones: ['Sesiones del panel', 'Quién tiene el panel abierto (no entra en el respaldo)'],
};

const VISTAS_DE_LA_BASE = ['v_reservas', 'v_tesis', 'v_solicitudes_solvencia', 'v_cuentas', 'v_actividad', 'v_eventos', 'v_cierres'];

function tamano(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function Dato({ etiqueta, children, tono }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{etiqueta}</dt>
      <dd className={`break-words text-sm font-medium ${tono === 'error' ? 'text-red-700' : 'text-slate-900'}`}>{children}</dd>
    </div>
  );
}

// Datos y respaldo (solo el administrador): dónde está guardado todo lo de la biblioteca y un respaldo para descargar. Con una base de
// datos PostgreSQL (por ejemplo Supabase) los datos viven ahí y sobreviven a cada publicación; sin ella están en archivos del servidor.
export default function AlmacenamientoPage() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorDeRespaldo, setErrorDeRespaldo] = useState('');

  const cargar = useCallback(async () => {
    try {
      const res = await adminApi.almacenamiento();
      setDatos(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo consultar dónde están guardados los datos'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(() => {
      if (!document.hidden) cargar();
    }, 30000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  async function descargar() {
    setDescargando(true);
    setAviso('');
    setErrorDeRespaldo('');
    try {
      const res = await adminApi.respaldo();
      const nombre = /filename="([^"]+)"/.exec(res.headers['content-disposition'] ?? '')?.[1] ?? 'respaldo-biblioteca.json';
      const direccion = URL.createObjectURL(res.data);
      const enlace = document.createElement('a');
      enlace.href = direccion;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(direccion), 2000);
      setAviso(`Respaldo descargado: ${nombre}. Guárdalo en un lugar seguro: lleva datos de estudiantes.`);
    } catch (err) {
      setErrorDeRespaldo(getErrorMessage(err, 'No se pudo descargar el respaldo'));
    } finally {
      setDescargando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Consultando dónde están guardados los datos...
      </div>
    );
  }

  if (!datos) {
    return <AlertBanner>{error || 'No se pudo consultar dónde están guardados los datos'}</AlertBanner>;
  }

  const enBaseDeDatos = datos.modo === 'postgres';

  return (
    <PaginaAdmin
      descripcion="Dónde se guarda todo lo de la biblioteca (catálogo con sus códigos QR, reservas, solicitudes, cuentas, horarios) y un respaldo para descargar."
      acciones={
        <Button variant="secondary" icon={RefreshCw} onClick={cargar}>
          Actualizar
        </Button>
      }
    >
      <AlertBanner>{error}</AlertBanner>

      {!enBaseDeDatos && datos.enProduccion ? (
        <Nota tono="aviso" titulo="Los datos están en archivos de este servidor">
          Si la plataforma donde está publicada la biblioteca no conserva el disco, se pierden en cada publicación. Para guardarlos en una base de datos
          PostgreSQL (por ejemplo Supabase), define <code className="rounded bg-white/70 px-1 font-mono text-[13px]">DATABASE_URL</code> en el servidor (ver README).
        </Nota>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Dónde se guarda</h2>
          <Badge tone={enBaseDeDatos ? 'status' : 'warning'} dot>
            {enBaseDeDatos ? 'Base de datos PostgreSQL' : 'Archivos en el servidor'}
          </Badge>
        </div>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Dato etiqueta={enBaseDeDatos ? 'Base de datos' : 'Carpeta'}>{datos.destino}</Dato>
          {enBaseDeDatos ? <Dato etiqueta="Conexión">{datos.conectado ? 'Conectada' : 'Sin conexión: se sigue trabajando en memoria y se guarda al volver'}</Dato> : null}
          <Dato etiqueta="Último guardado">{datos.ultimoGuardado ? fechaLegible(datos.ultimoGuardado) : 'Todavía nada desde que se encendió el servidor'}</Dato>
          <Dato etiqueta="Esperando guardarse">{datos.pendientes === 0 ? 'Nada: todo está guardado' : `${datos.pendientes} documento${datos.pendientes === 1 ? '' : 's'}`}</Dato>
          <Dato etiqueta="Último error" tono={datos.ultimoError ? 'error' : undefined}>
            {datos.ultimoError ? `${fechaLegible(datos.ultimoError.fecha)} · ${datos.ultimoError.mensaje}` : 'Ninguno'}
          </Dato>
        </dl>
        {enBaseDeDatos ? (
          <Nota tono="info" titulo="Verlos como tablas">
            En el panel de Supabase, abre <b>Table Editor</b> y elige el esquema <b>biblioteca</b>: ahí están{' '}
            {VISTAS_DE_LA_BASE.map((vista, i) => (
              <span key={vista}>
                <code className="rounded bg-white/70 px-1 font-mono text-[13px]">{vista}</code>
                {i < VISTAS_DE_LA_BASE.length - 1 ? ', ' : '. '}
              </span>
            ))}
            Son de solo lectura y se pueden exportar a CSV; los cambios se hacen desde este panel.
          </Nota>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Respaldo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Un archivo con todo lo guardado (sin las claves de las cuentas), para tener una copia fuera del servidor. Descarga uno cada semana y antes de cambios grandes:
            el plan gratuito de Supabase no hace copias de seguridad que se puedan descargar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="brand" icon={Download} onClick={descargar} disabled={descargando}>
            {descargando ? 'Preparando...' : 'Descargar respaldo'}
          </Button>
          <span className="text-xs text-slate-500">Lleva datos de estudiantes (carné, CUI, correo): guárdalo en un lugar seguro.</span>
        </div>
        {aviso ? (
          <Nota tono="ok">
            <span role="status">{aviso}</span>
          </Nota>
        ) : null}
        <AlertBanner>{errorDeRespaldo}</AlertBanner>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">Lo que se guarda</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Qué es', 'Tamaño', 'Última vez guardado'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {datos.documentos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-400">
                    Todavía no hay nada guardado.
                  </td>
                </tr>
              ) : (
                datos.documentos.map((d) => {
                  const [nombre, detalle] = DOCUMENTOS[d.nombre] ?? [d.nombre, ''];
                  return (
                    <tr key={d.nombre}>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-900">{nombre}</span>
                        {detalle ? <span className="block text-xs text-slate-500">{detalle}</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-600">{tamano(d.bytes)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{d.actualizadoEn ? fechaLegible(d.actualizadoEn) : '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PaginaAdmin>
  );
}
