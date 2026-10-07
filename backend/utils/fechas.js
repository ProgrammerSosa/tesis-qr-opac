// Fechas y horas como las usa la biblioteca: "año-mes-día" (2026-10-07) y "hora:minutos" (08:10), en la hora local del
// servidor. El servidor arranca con la zona horaria de Guatemala (ver server.js), así "hoy" es el día de la biblioteca.

const dos = (n) => String(n).padStart(2, '0');

function fechaLocal(fecha = new Date()) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

function esFechaISO(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T12:00:00`);
  return !Number.isNaN(fecha.getTime()) && fechaLocal(fecha) === texto; // descarta fechas como 2026-02-31
}

function sumarDias(texto, dias) {
  const fecha = new Date(`${texto}T12:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocal(fecha);
}

// 0 = domingo ... 6 = sábado
function diaDeLaSemana(texto) {
  return new Date(`${texto}T12:00:00`).getDay();
}

function aMinutos(hora) {
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

function minutosDelDia(fecha = new Date()) {
  return fecha.getHours() * 60 + fecha.getMinutes();
}

module.exports = { fechaLocal, esFechaISO, sumarDias, diaDeLaSemana, aMinutos, minutosDelDia };
