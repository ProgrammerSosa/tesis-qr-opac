import { diaDeLaSemana, diasDelMes, fechaConMes, fechaLarga, nombreDelMes, primerDiaDelMes, sumarDias, sumarMeses } from '../../shared/utils/fechas';

// Períodos de las estadísticas: un día, una semana (de lunes a domingo), un mes, un año, todo lo registrado o un rango de fechas.
// Cada período se calcula a partir de una fecha de referencia ("2026-10-19"); las fechas van y vienen como texto ISO.
export const MODOS = [
  ['dia', 'Día'],
  ['semana', 'Semana'],
  ['mes', 'Mes'],
  ['anio', 'Año'],
  ['todo', 'Todo'],
  ['rango', 'Entre fechas'],
];

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
const ultimoDelMes = (iso) => `${iso.slice(0, 8)}${String(diasDelMes(iso)).padStart(2, '0')}`;

// { desde, hasta } del período que contiene la fecha de referencia (null en los dos para «todo»).
export function rangoDe(modo, referencia) {
  if (modo === 'dia') return { desde: referencia, hasta: referencia };
  if (modo === 'semana') {
    const lunes = sumarDias(referencia, -((diaDeLaSemana(referencia) + 6) % 7));
    return { desde: lunes, hasta: sumarDias(lunes, 6) };
  }
  if (modo === 'mes') return { desde: primerDiaDelMes(referencia), hasta: ultimoDelMes(referencia) };
  if (modo === 'anio') return { desde: `${referencia.slice(0, 4)}-01-01`, hasta: `${referencia.slice(0, 4)}-12-31` };
  return { desde: null, hasta: null };
}

// La fecha de referencia del período anterior (paso -1) o siguiente (paso 1).
export function moverReferencia(modo, referencia, paso) {
  if (modo === 'dia') return sumarDias(referencia, paso);
  if (modo === 'semana') return sumarDias(referencia, 7 * paso);
  if (modo === 'mes') return sumarMeses(referencia, paso);
  if (modo === 'anio') return `${Number(referencia.slice(0, 4)) + paso}-01-01`;
  return referencia;
}

// Cómo se lee el período: «Lunes, 19 de octubre de 2026», «Del 12 al 18 de octubre de 2026», «Octubre de 2026», «2026».
export function nombreDelPeriodo(modo, { desde, hasta }) {
  if (!desde && !hasta) return 'Todo lo registrado';
  if (modo === 'mes') return `${mayuscula(nombreDelMes(desde))} de ${desde.slice(0, 4)}`;
  if (modo === 'anio') return `Año ${desde.slice(0, 4)}`;
  if (!hasta) return `Desde el ${fechaConMes(desde)}`;
  if (!desde) return `Hasta el ${fechaConMes(hasta)}`;
  if (desde === hasta) return mayuscula(fechaLarga(desde));
  if (desde.slice(0, 7) === hasta.slice(0, 7)) return `Del ${Number(desde.slice(8))} al ${fechaConMes(hasta)}`;
  if (desde.slice(0, 4) === hasta.slice(0, 4)) return `Del ${Number(desde.slice(8))} de ${nombreDelMes(desde)} al ${fechaConMes(hasta)}`;
  return `Del ${fechaConMes(desde)} al ${fechaConMes(hasta)}`;
}
