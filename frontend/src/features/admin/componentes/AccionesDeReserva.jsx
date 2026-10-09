import { DoorOpen, LogIn, LogOut, X } from 'lucide-react';

const ESTILOS = {
  principal: 'border-primary bg-primary text-white hover:bg-primary-dark',
  neutro: 'border-border bg-white text-slate-700 hover:border-slate-400',
  peligro: 'border-red-200 bg-white text-red-700 hover:border-red-400 hover:bg-red-50',
};

function Boton({ icono: Icono, tono = 'neutro', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 ${ESTILOS[tono]}`}
      {...props}
    >
      <Icono size={14} aria-hidden="true" />
      {children}
    </button>
  );
}

// Lo que el personal puede hacer con una reserva según su estado:
//  reservado: «Llegó» (sella el ingreso), «No llegó» (libera el lugar) y cancelar
//  en uso:    «Se fue» (sella la salida; si se va antes, las horas que no usó quedan libres) y cancelar
// Una reserva finalizada, liberada o cancelada ya no tiene acciones.
export default function AccionesDeReserva({ reserva, ocupado = false, onIngreso, onSalida, onLiberar, onCancelar }) {
  if (reserva.estado === 'reservado') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Boton icono={LogIn} tono="principal" disabled={ocupado} onClick={onIngreso} title="La persona llegó: sella su ingreso">
          Llegó
        </Boton>
        <Boton icono={DoorOpen} disabled={ocupado} onClick={onLiberar} title="La persona no llegó o avisó que no vendrá: el lugar queda libre ahora">
          No llegó
        </Boton>
        <Boton icono={X} tono="peligro" disabled={ocupado} onClick={onCancelar} title="Cancelar la reserva">
          Cancelar
        </Boton>
      </div>
    );
  }
  if (reserva.estado === 'en_uso') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Boton icono={LogOut} tono="principal" disabled={ocupado} onClick={onSalida} title="La persona se fue: sella su salida">
          Se fue
        </Boton>
        <Boton icono={X} tono="peligro" disabled={ocupado} onClick={onCancelar} title="Cancelar la reserva">
          Cancelar
        </Boton>
      </div>
    );
  }
  return null;
}
