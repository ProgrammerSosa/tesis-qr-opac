import { usePortada } from '../portada/PortadaContext';

// "Abierto ahora · hasta las 19:30" o "Cerrado · abre mañana a las 08:10". El servidor calcula el estado con los horarios
// y los cierres que configuró el administrador; aquí solo se redacta.
function describirEstado(estado) {
  if (!estado) return null;
  if (estado.abierto) {
    return { abierto: true, titulo: 'Abierto ahora', detalle: `Atendemos hasta las ${estado.hasta}` };
  }
  if (estado.cierreHoy) {
    return { abierto: false, titulo: 'Cerrado hoy', detalle: estado.cierreHoy.motivo };
  }
  const p = estado.proxima;
  if (!p) return { abierto: false, titulo: 'Cerrado', detalle: 'Consulta los horarios de atención' };
  const cuando = p.esHoy ? `hoy a las ${p.hora}` : p.esManana ? `mañana a las ${p.hora}` : `el ${p.dia.toLowerCase()} a las ${p.hora}`;
  return { abierto: false, titulo: 'Cerrado ahora', detalle: `Abrimos ${cuando}` };
}

// `tema`: "oscuro" para la barra superior y el hero; "claro" para tarjetas blancas.
export default function EstadoDeApertura({ tema = 'oscuro', conDetalle = true, className = '' }) {
  const { portada } = usePortada();
  const estado = describirEstado(portada?.horario?.estado);
  if (!estado) return null;

  const colorPunto = estado.abierto ? 'bg-emerald-400' : 'bg-red-400';
  const colorTexto = tema === 'oscuro' ? 'text-white' : 'text-slate-900';
  const colorDetalle = tema === 'oscuro' ? 'text-white/70' : 'text-slate-500';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        {estado.abierto ? <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${colorPunto}`} /> : null}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colorPunto}`} />
      </span>
      <span className={`text-sm font-bold ${colorTexto}`}>{estado.titulo}</span>
      {conDetalle ? <span className={`text-sm ${colorDetalle}`}>· {estado.detalle}</span> : null}
    </span>
  );
}
