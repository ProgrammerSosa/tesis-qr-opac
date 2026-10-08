import { Select } from '../../shared/components/FormField';
import Nota from '../../shared/components/Nota';
import { horasEntre, horasFinalesPosibles, textoDeHoras } from './rangosDeHoras';

// La persona escribe de qué hora a qué hora quiere el cubículo: «Desde» ofrece las horas del día que todavía no pasaron y «Hasta» las
// horas finales posibles desde la elegida (horas seguidas, sin cruzar la pausa del mediodía y sin pasar del máximo por reserva).
// Si el cubículo ya está reservado en esas horas, se le dice para que elija otro cubículo o cambie la hora.
export default function RangoDeHoras({ horas, pasada, inicio, fin, maxHoras, choques, todoElDiaReservado, onCambiar }) {
  const inicios = horas.filter((hora) => !pasada(hora));
  const finales = inicio ? horasFinalesPosibles(horas, inicio, maxHoras) : [];

  function elegirInicio(nuevo) {
    const posibles = horasFinalesPosibles(horas, nuevo, maxHoras);
    onCambiar({ inicio: nuevo, fin: posibles.includes(fin) ? fin : (posibles[0] ?? '') });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Desde" value={inicio} onChange={(e) => elegirInicio(e.target.value)}>
          {inicios.map((hora) => (
            <option key={hora} value={hora}>
              {hora}
            </option>
          ))}
        </Select>
        <Select label="Hasta" value={fin} onChange={(e) => onCambiar({ inicio, fin: e.target.value })}>
          {finales.map((hora) => (
            <option key={hora} value={hora}>
              {hora} ({textoDeHoras(horasEntre(inicio, hora))})
            </option>
          ))}
        </Select>
      </div>

      {todoElDiaReservado ? (
        <Nota tono="error">Este cubículo ya está reservado todo el día. Intenta con otro cubículo o cambia la fecha.</Nota>
      ) : choques.length > 0 ? (
        <Nota tono="error">
          Este cubículo ya está reservado {choques.map(([desde, hasta]) => `de ${desde} a ${hasta}`).join(' y ')}. Intenta con otro cubículo o cambia la
          hora.
        </Nota>
      ) : inicio && fin ? (
        <p className="text-sm font-semibold text-slate-900" role="status">
          De <span className="font-mono">{inicio}</span> a <span className="font-mono">{fin}</span> · {textoDeHoras(horasEntre(inicio, fin))}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">
        Las reservas son por horas enteras, hasta {textoDeHoras(maxHoras)} seguidas. No se puede reservar a través de la pausa del mediodía.
      </p>
    </div>
  );
}
