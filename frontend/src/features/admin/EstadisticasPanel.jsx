import { useCallback, useEffect, useState } from 'react';
import { Armchair, DoorOpen, Download, FileCheck2, FileText, Loader2, Mail, MonitorSmartphone, Printer, QrCode, Receipt, RefreshCw, Search } from 'lucide-react';
import { adminApi } from './adminApi';
import { getErrorMessage } from '../../shared/api/axiosClient';
import AlertBanner from '../../shared/components/AlertBanner';
import Button from '../../shared/components/Button';
import StatTile from '../../shared/components/StatTile';
import { fechaLegible } from './estados';

// Barras horizontales hechas con divs: cada fila muestra también el número, así no depende solo del color.
function Barras({ filas }) {
  const maximo = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ul className="flex flex-col gap-1.5">
      {filas.map((f) => (
        <li key={f.etiqueta} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-xs">
          <span className="text-slate-600">{f.etiqueta}</span>
          <span className="h-3 overflow-hidden rounded-full bg-surface">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(f.valor / maximo) * 100}%` }} />
          </span>
          <span className="text-right font-semibold text-slate-700">{f.valor}</span>
        </li>
      ))}
    </ul>
  );
}

function Tarjeta({ titulo, children }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
      {children}
    </section>
  );
}

function SinDatos({ children }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

// Estadísticas de uso de los servicios (propuesta, sección 4.5.7).
export default function EstadisticasPanel() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await adminApi.estadisticas();
      setDatos(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudieron cargar las estadísticas'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!datos) {
    return cargando ? (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={18} />
        Cargando estadísticas...
      </div>
    ) : (
      <AlertBanner>{error}</AlertBanner>
    );
  }

  const { totales, comprobantes, porHora, porDia, tesisMasConsultadas, kioscos } = datos;
  const hayReservas = porHora.some((h) => h.total > 0);

  return (
    <section className="flex flex-col gap-4">
      <AlertBanner>{error}</AlertBanner>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">Datos calculados el {fechaLegible(datos.generadoEn)}.</p>
        <Button variant="secondary" icon={RefreshCw} onClick={cargar} disabled={cargando}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Búsquedas en el OPAC" value={totales.busquedasOpac} icon={Search} />
        <StatTile label="Consultas de tesis digitales" value={totales.consultasDigitales} icon={FileText} />
        <StatTile label="Descargas de tesis digitales" value={totales.descargasDigitales} icon={Download} />
        <StatTile label="Accesos por código QR" value={totales.accesosQr} icon={QrCode} />
        <StatTile label="Reservas de cubículos" value={totales.reservasCubiculos} icon={DoorOpen} />
        <StatTile label="Reservas de espacios de estudio" value={totales.reservasEspacios} icon={Armchair} />
        <StatTile label="Solicitudes de solvencia" value={totales.solicitudesSolvencia} icon={FileCheck2} />
        <StatTile label="Sesiones en kioscos" value={totales.sesionesKiosco} icon={MonitorSmartphone} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Tarjeta titulo="Comprobantes">
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Generados" value={comprobantes.generados} icon={Receipt} />
            <StatTile label="Impresos" value={comprobantes.impresos} icon={Printer} />
            <StatTile label="Por correo" value={comprobantes.porCorreo} icon={Mail} />
          </div>
        </Tarjeta>

        <Tarjeta titulo="Horarios con mayor demanda">
          {hayReservas ? (
            <Barras filas={porHora.map((h) => ({ etiqueta: h.hora, valor: h.total }))} />
          ) : (
            <SinDatos>Aún no hay reservas para calcular la demanda.</SinDatos>
          )}
        </Tarjeta>

        <Tarjeta titulo="Días con mayor utilización">
          {hayReservas ? (
            <Barras filas={porDia.map((d) => ({ etiqueta: d.dia, valor: d.total }))} />
          ) : (
            <SinDatos>Aún no hay reservas para calcular la utilización.</SinDatos>
          )}
        </Tarjeta>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Tesis más consultadas">
          {tesisMasConsultadas.length === 0 ? (
            <SinDatos>Aún no se ha consultado ninguna tesis digital.</SinDatos>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {tesisMasConsultadas.map((t, i) => (
                <li key={t.id} className="flex items-start gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug text-slate-900">{t.titulo}</span>
                    <span className="block text-xs text-slate-500">
                      {t.consultas} consultas digitales · {t.accesosQr} accesos por QR · <span className="font-mono">{t.id}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>

        <Tarjeta titulo="Uso por kiosco">
          {kioscos.length === 0 ? (
            <SinDatos>Aún no hay sesiones registradas en los kioscos.</SinDatos>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-1.5 font-semibold">Kiosco</th>
                  <th className="py-1.5 font-semibold">Sesiones</th>
                  <th className="py-1.5 font-semibold">Reservas y solicitudes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kioscos.map((k) => (
                  <tr key={k.kiosco}>
                    <td className="py-2 font-semibold">Kiosco {k.kiosco}</td>
                    <td className="py-2">{k.sesiones}</td>
                    <td className="py-2">{k.operaciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tarjeta>
      </div>
    </section>
  );
}
