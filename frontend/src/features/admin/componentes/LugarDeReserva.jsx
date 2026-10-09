import { Armchair, DoorClosed, MonitorSmartphone } from 'lucide-react';
import { TIPO_RESERVA } from '../estados';

const ICONOS = { cubiculo: DoorClosed, estacion: MonitorSmartphone, sala_lectura: Armchair };

// El lugar que tomó una reserva, bien a la vista: su icono, su nombre («Cubículo 3», «Mesa 2 · Silla 3») y de qué tipo es.
export default function LugarDeReserva({ reserva, grande = false }) {
  const Icono = ICONOS[reserva.tipo] ?? DoorClosed;
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className={`grid shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ${grande ? 'h-10 w-10' : 'h-9 w-9'}`}>
        <Icono size={grande ? 20 : 18} aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block truncate font-bold text-slate-900 ${grande ? 'text-base' : 'text-sm'}`}>{reserva.recursoNombre}</span>
        <span className="block truncate text-xs text-slate-500">{TIPO_RESERVA[reserva.tipo] ?? reserva.tipo}</span>
      </span>
    </span>
  );
}
