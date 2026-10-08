import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { diaDeLaSemana, diasDelMes, fechaLarga, nombreDelMes, primerDiaDelMes, sumarDias, sumarMeses } from '../../shared/utils/fechas';

const SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const NOMBRE_DE_LA_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

function BotonDeMes({ onClick, deshabilitado, etiqueta, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={etiqueta}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/10"
    >
      {children}
    </button>
  );
}

// Calendario para elegir el día de una reserva: un mes a la vista, con los días de cierre marcados, hoy resaltado y atajos para hoy y mañana.
// `dias` dice cómo está cada día ({ cerrado, motivo, horas }); un día de cierre se puede tocar para ver por qué está cerrado.
export default function SelectorDeDia({ valor, onCambiar, hoy, minimo, maximo, dias }) {
  const [mes, setMes] = useState(() => primerDiaDelMes(valor));
  const [foco, setFoco] = useState(null);
  const rejilla = useRef(null);

  // Si el día elegido está en otro mes (por ejemplo, con el atajo de «mañana» el último día del mes), el calendario lo sigue.
  useEffect(() => {
    setMes(primerDiaDelMes(valor));
  }, [valor]);

  const columnaDelPrimero = (diaDeLaSemana(mes) + 6) % 7; // la semana empieza en lunes
  const prefijo = mes.slice(0, 8);
  const fechasDelMes = Array.from({ length: diasDelMes(mes) }, (_, i) => `${prefijo}${String(i + 1).padStart(2, '0')}`);
  const habilitado = (fecha) => fecha >= minimo && fecha <= maximo;
  const primeraHabilitada = fechasDelMes.find(habilitado);
  // Solo un día del calendario recibe el foco con el tabulador; con las flechas se mueve de uno a otro.
  const conTab = fechasDelMes.includes(foco) && habilitado(foco) ? foco : fechasDelMes.includes(valor) ? valor : primeraHabilitada;

  const puedeAtras = primerDiaDelMes(minimo) < mes;
  const puedeAdelante = sumarMeses(mes, 1) <= maximo;
  const manana = sumarDias(hoy, 1);

  function alTeclear(e) {
    const salto = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const actual = e.target?.dataset?.fecha;
    if (salto === undefined || !actual) return;
    const boton = rejilla.current?.querySelector(`button[data-fecha="${sumarDias(actual, salto)}"]:not(:disabled)`);
    if (boton) {
      e.preventDefault();
      boton.focus();
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <div className="hero-bg flex items-center justify-between gap-3 px-4 py-4 text-white">
        <BotonDeMes onClick={() => setMes(sumarMeses(mes, -1))} deshabilitado={!puedeAtras} etiqueta="Mes anterior">
          <ChevronLeft size={20} aria-hidden="true" />
        </BotonDeMes>
        <div className="min-w-0 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Día de tu reserva</p>
          <p className="font-display text-2xl font-semibold leading-tight" aria-live="polite">
            {mayuscula(nombreDelMes(mes))} <span className="text-blue-200">{mes.slice(0, 4)}</span>
          </p>
        </div>
        <BotonDeMes onClick={() => setMes(sumarMeses(mes, 1))} deshabilitado={!puedeAdelante} etiqueta="Mes siguiente">
          <ChevronRight size={20} aria-hidden="true" />
        </BotonDeMes>
      </div>

      <div className="px-3 pb-4 pt-3 sm:px-4">
        <div className="grid grid-cols-7 gap-1 pb-1.5" aria-hidden="true">
          {SEMANA.map((letra, i) => (
            <span key={NOMBRE_DE_LA_SEMANA[i]} className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {letra}
            </span>
          ))}
        </div>

        <div ref={rejilla} onKeyDown={alTeclear} role="group" aria-label={`${nombreDelMes(mes)} de ${mes.slice(0, 4)}`} className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: columnaDelPrimero }, (_, i) => (
            <span key={`vacio-${i}`} />
          ))}
          {fechasDelMes.map((fecha) => {
            const info = dias?.[fecha];
            const fuera = !habilitado(fecha);
            const cerrado = Boolean(info?.cerrado);
            const sinReservas = !cerrado && info !== undefined && info.horas === 0;
            const esHoy = fecha === hoy;
            const elegido = fecha === valor;

            let estilo = 'text-slate-800 hover:bg-blue-50 hover:text-primary active:scale-95';
            if (fuera) estilo = 'cursor-not-allowed text-slate-300';
            else if (elegido) estilo = 'scale-105 bg-primary text-white shadow-lift';
            else if (cerrado) estilo = 'bg-red-50 text-red-700 hover:bg-red-100 active:scale-95';
            else if (sinReservas) estilo = 'bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95';

            const motivo = cerrado ? `Cerrado${info.motivo ? `: ${info.motivo}` : ''}` : sinReservas ? 'Sin reservas ese día' : esHoy ? 'Hoy' : undefined;
            return (
              <button
                key={fecha}
                type="button"
                data-fecha={fecha}
                disabled={fuera}
                tabIndex={fecha === conTab ? 0 : -1}
                onFocus={() => setFoco(fecha)}
                onClick={() => onCambiar(fecha)}
                aria-pressed={elegido}
                aria-current={esHoy ? 'date' : undefined}
                aria-label={`${fechaLarga(fecha)}${esHoy ? ', hoy' : ''}${motivo && !esHoy ? `, ${motivo.toLowerCase()}` : ''}`}
                title={motivo}
                className={`relative flex h-11 w-full items-center justify-center rounded-xl text-[15px] font-semibold tabular-nums outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${estilo} ${
                  esHoy && !elegido && !fuera ? 'ring-2 ring-inset ring-primary/40' : ''
                }`}
              >
                {Number(fecha.slice(8))}
                {!fuera && (esHoy || cerrado) ? (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${elegido ? 'bg-white' : cerrado ? 'bg-red-500' : 'bg-primary'}`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border pt-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCambiar(hoy)}
              disabled={!habilitado(hoy)}
              className="min-h-10 rounded-full border border-border bg-white px-4 text-sm font-bold text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => onCambiar(manana)}
              disabled={!habilitado(manana)}
              className="min-h-10 rounded-full border border-border bg-white px-4 text-sm font-bold text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mañana
            </button>
          </div>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-2 ring-inset ring-primary/40" aria-hidden="true" />
              Hoy
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-100" aria-hidden="true" />
              Cerrado
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-slate-200" aria-hidden="true" />
              Sin reservas
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
