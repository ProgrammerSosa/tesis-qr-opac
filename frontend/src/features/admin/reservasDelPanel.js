import { ahoraEnLaBiblioteca } from '../../shared/utils/fechas';

// Cálculos con las horas de las reservas para el personal. Todo se hace con la hora de la biblioteca (Guatemala), como el resto
// del sitio, aunque el navegador de quien atiende esté en otra zona.

const dos = (n) => String(n).padStart(2, '0');

export const aMinutos = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

// "10:15" a partir de minutos desde la medianoche.
export const horaDeMinutos = (minutos) => `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;

// Qué hora es en la biblioteca: { fecha: '2026-10-09', minutos: 620 }.
export function relojDeLaBiblioteca(ahora = new Date()) {
  const { fecha, hora, minutos } = ahoraEnLaBiblioteca(ahora);
  return { fecha, minutos: hora * 60 + minutos };
}

// "5 min", "1 h", "1 h 20 min".
export function textoDeDuracion(minutos) {
  const total = Math.max(Math.round(minutos), 0);
  if (total < 60) return `${total} min`;
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

// Qué le toca al personal con una reserva de hoy:
//  en_uso     la persona está adentro; `minutosParaTerminar` es lo que le queda de su hora
//  esperando  su hora ya empezó y no ha llegado; se libera sola cuando se acabe la tolerancia (`liberaA`)
//  por_llegar empieza más tarde hoy
// Las reservas de otros días, o ya cerradas, no tienen nada pendiente (null).
export function situacionDeHoy(reserva, reloj, tolerancia) {
  if (reserva.fecha !== reloj.fecha) return null;
  if (reserva.estado === 'en_uso') {
    return { tipo: 'en_uso', minutosParaTerminar: aMinutos(reserva.horaFin) - reloj.minutos };
  }
  if (reserva.estado !== 'reservado') return null;
  const inicio = aMinutos(reserva.hora);
  if (reloj.minutos >= inicio) {
    return { tipo: 'esperando', minutosParaLiberarse: inicio + tolerancia - reloj.minutos, liberaA: horaDeMinutos(inicio + tolerancia) };
  }
  return { tipo: 'por_llegar', minutosParaEmpezar: inicio - reloj.minutos };
}

// Las horas que quedarían libres si la persona se va ahora: la hora que ya empezó cuenta como usada y siempre se conserva al
// menos una (igual que en el servidor). null si no libera nada, o si la reserva no es de hoy.
export function horasQueSeLiberan(reserva, reloj) {
  if (reserva.fecha !== reloj.fecha) return null;
  const inicio = Number(reserva.hora.slice(0, 2));
  const fin = Number(reserva.horaFin.slice(0, 2));
  const nuevoFin = Math.max(Math.ceil(reloj.minutos / 60), inicio + 1);
  return nuevoFin < fin ? { desde: `${dos(nuevoFin)}:00`, hasta: reserva.horaFin } : null;
}
