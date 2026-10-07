import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { adminApi } from '../adminApi';
import BarraDeFiltros from '../componentes/BarraDeFiltros';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { ACCIONES_DE_ACTIVIDAD, CATEGORIAS_DE_ACTIVIDAD, ROLES_DEL_PERSONAL, fechaLegible } from '../estados';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Button from '../../../shared/components/Button';

// Actividad del personal (solo el administrador): quién hizo qué y cuándo en el panel. Sirve para revisar cambios y
// detectar modificaciones accidentales (propuesta, sección 4.5.6). Muestra lo más reciente primero.
export default function ActividadPage() {
  const [registros, setRegistros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuario, setUsuario] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await adminApi.actividad({ usuario: usuario || undefined, categoria: categoria || undefined, limite: 200 });
      setRegistros(res.data.data.registros);
      // La lista de personas se arma con toda la actividad, no solo con la que deja pasar el filtro actual.
      if (!usuario && !categoria) setUsuarios(res.data.data.usuarios);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la actividad'));
    } finally {
      setCargando(false);
    }
  }, [usuario, categoria]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <PaginaAdmin
      descripcion="Lo que ha hecho el personal en el panel: quién, cuándo y qué. Se conservan los últimos 1000 movimientos."
      acciones={
        <Button variant="secondary" icon={RefreshCw} onClick={cargar} disabled={cargando}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </Button>
      }
    >
      <AlertBanner>{error}</AlertBanner>
      <BarraDeFiltros
        filtros={[
          { etiqueta: 'Toda la actividad', valor: categoria, onCambio: setCategoria, opciones: Object.entries(CATEGORIAS_DE_ACTIVIDAD) },
          { etiqueta: 'Todo el personal', valor: usuario, onCambio: setUsuario, opciones: usuarios.map((u) => [u, u]) },
        ]}
        resumen={cargando && registros.length === 0 ? '' : `${registros.length} movimientos`}
      />

      {cargando && registros.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={18} />
          Cargando actividad...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Fecha y hora', 'Persona', 'Acción', 'Detalle'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                    No hay movimientos con esos filtros.
                  </td>
                </tr>
              ) : (
                registros.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{fechaLegible(r.fecha)}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-slate-900">{r.nombre ?? r.usuario}</span>
                      <span className="block text-xs text-slate-500">
                        <span className="font-mono">{r.usuario}</span>
                        {r.rol ? ` · ${ROLES_DEL_PERSONAL[r.rol]?.nombre ?? r.rol}` : ''}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{ACCIONES_DE_ACTIVIDAD[r.accion] ?? r.accion}</td>
                    <td className="px-3 py-2.5 text-slate-600">{r.detalle || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </PaginaAdmin>
  );
}
