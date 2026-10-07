import { LIBRARY } from '../config/library';

// La biblioteca trabaja en hora de Guatemala. Estas funciones calculan "hoy" y "ahora" en esa zona aunque el navegador
// de la persona esté configurado en otra (un celular en el extranjero, un equipo mal configurado). Guatemala no cambia
// de hora en el año, así que el cálculo es estable.
const formateador = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIBRARY.zonaHoraria,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function ahoraEnLaBiblioteca(fecha = new Date()) {
  const partes = Object.fromEntries(formateador.formatToParts(fecha).map((p) => [p.type, p.value]));
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    hora: Number(partes.hour),
    minutos: Number(partes.minute),
  };
}

export function hoyISO() {
  return ahoraEnLaBiblioteca().fecha;
}

// Minutos transcurridos desde la medianoche, en hora de la biblioteca.
export function minutosDelDia(fecha = new Date()) {
  const { hora, minutos } = ahoraEnLaBiblioteca(fecha);
  return hora * 60 + minutos;
}

export function sumarDias(iso, dias) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

// 0 = domingo ... 6 = sábado
export function diaDeLaSemana(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
}

function aFechaUTC(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

// "miércoles 7 de octubre de 2026"
export function fechaLarga(iso) {
  return new Intl.DateTimeFormat('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(aFechaUTC(iso));
}

// "mié 7 oct"
export function fechaCorta(iso) {
  return new Intl.DateTimeFormat('es-GT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(aFechaUTC(iso))
    .replace(/\./g, '');
}

// "7 de octubre de 2026"
export function fechaConMes(iso) {
  return new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(aFechaUTC(iso));
}

// Para las fechas con hora que guarda el servidor (ISO con zona): "07/10/2026 14:05" en hora de la biblioteca.
export function fechaYHora(iso) {
  const d = new Date(iso);
  const partes = Object.fromEntries(formateador.formatToParts(d).map((p) => [p.type, p.value]));
  return { fecha: `${partes.day}/${partes.month}/${partes.year}`, hora: `${partes.hour}:${partes.minute}` };
}

// Lista de tramos de horario [["08:00","12:50"],["13:10","19:15"]] -> "08:00 – 12:50 y 13:10 – 19:15"
export function textoDeTramos(tramos) {
  if (!tramos || tramos.length === 0) return 'Cerrado';
  return tramos.map(([desde, hasta]) => `${desde} – ${hasta}`).join(' y ');
}
