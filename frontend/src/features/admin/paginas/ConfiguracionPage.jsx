import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { adminApi } from '../adminApi';
import PaginaAdmin from '../componentes/PaginaAdmin';
import { fechaLegible } from '../estados';
import { getErrorMessage } from '../../../shared/api/axiosClient';
import AlertBanner from '../../../shared/components/AlertBanner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';

const SERVICIOS = [
  { tipo: 'cubiculo', nombre: 'Cubículos', detalle: 'Reservas para preparar fases o estudiar en grupo.' },
  { tipo: 'estacion', nombre: 'Estaciones', detalle: 'Puestos individuales con una sola silla.' },
  { tipo: 'sala_lectura', nombre: 'Sala de lectura', detalle: 'Mesas compartidas de seis sillas.' },
];

// Configuración general (solo el administrador; propuesta, sección 4.5.6). Los cambios rigen desde que se guardan,
// tanto en los kioscos como en la web.
export default function ConfiguracionPage() {
  const [guardada, setGuardada] = useState(null); // lo que tiene el servidor
  const [tolerancia, setTolerancia] = useState('');
  const [pausadas, setPausadas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  function cargarEnFormulario(configuracion) {
    setGuardada(configuracion);
    setTolerancia(String(configuracion.toleranciaMinutos));
    setPausadas(configuracion.reservasPausadas);
  }

  useEffect(() => {
    adminApi
      .configuracion()
      .then((res) => cargarEnFormulario(res.data.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar la configuración')))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando configuración...
      </div>
    );
  }

  if (!guardada) {
    return <AlertBanner>{error || 'No se pudo cargar la configuración'}</AlertBanner>;
  }

  const { toleranciaMinima, toleranciaMaxima } = guardada.limites;
  const hayCambios =
    Number(tolerancia) !== guardada.toleranciaMinutos || SERVICIOS.some(({ tipo }) => pausadas[tipo] !== guardada.reservasPausadas[tipo]);

  async function guardar(e) {
    e.preventDefault();
    const minutos = Number(tolerancia);
    if (!Number.isInteger(minutos) || minutos < toleranciaMinima || minutos > toleranciaMaxima) {
      setError(`La tolerancia debe ser un número entero de ${toleranciaMinima} a ${toleranciaMaxima} minutos.`);
      return;
    }
    setGuardando(true);
    setError('');
    setAviso('');
    try {
      const res = await adminApi.guardarConfiguracion({ toleranciaMinutos: minutos, reservasPausadas: pausadas });
      cargarEnFormulario(res.data.data);
      setAviso('Configuración guardada. Ya rige en los kioscos y en la web.');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la configuración'));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PaginaAdmin descripcion="Ajustes generales de las reservas. Lo que guardes rige desde ese momento, sin reiniciar nada.">
      <form onSubmit={guardar} className="flex max-w-3xl flex-col gap-5">
        <AlertBanner>{error}</AlertBanner>
        {aviso ? (
          <p role="status" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-primary-dark">
            {aviso}
          </p>
        ) : null}

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Tiempo de tolerancia</h2>
          <p className="text-sm text-slate-600">
            Si quien reservó no se presenta dentro de estos minutos desde la hora de inicio, la reserva se libera sola y el lugar
            queda disponible. Vale para cubículos, estaciones y sala de lectura.
          </p>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="number"
              min={toleranciaMinima}
              max={toleranciaMaxima}
              step={1}
              required
              value={tolerancia}
              onChange={(e) => setTolerancia(e.target.value)}
              className="w-24 rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            minutos (de {toleranciaMinima} a {toleranciaMaxima})
          </label>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Pausar reservas</h2>
          <p className="text-sm text-slate-600">
            Mientras un tipo de lugar esté pausado, los kioscos y la web avisan y no aceptan reservas nuevas de ese tipo. Las reservas
            que ya existen no se tocan. Úsalo, por ejemplo, durante un cierre o mantenimiento.
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {SERVICIOS.map(({ tipo, nombre, detalle }) => (
              <li key={tipo} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{nombre}</span>
                  <span className="block text-xs text-slate-500">{detalle}</span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge tone={pausadas[tipo] ? 'warning' : 'status'} dot>
                    {pausadas[tipo] ? 'Pausadas' : 'Abiertas'}
                  </Badge>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(pausadas[tipo])}
                      onChange={(e) => setPausadas((previas) => ({ ...previas, [tipo]: e.target.checked }))}
                      className="h-4 w-4 accent-primary"
                    />
                    Pausar
                  </label>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" icon={Check} disabled={!hayCambios || guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <span className="text-xs text-slate-500">
            {guardada.actualizadaEn
              ? `Último cambio: ${fechaLegible(guardada.actualizadaEn)}, por ${guardada.actualizadaPor}.`
              : 'Todavía no se ha cambiado nada: rigen los valores iniciales.'}
          </span>
        </div>
      </form>
    </PaginaAdmin>
  );
}
