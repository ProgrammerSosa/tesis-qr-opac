// Textos y cálculos de horas para las reglas de reserva de cubículos (las reglas vienen del backend).

export function textoCubiculos(numeros) {
  if (numeros.length === 1) return `Cubículo ${numeros[0]}`;
  const consecutivos = numeros.every((n, i) => i === 0 || n === numeros[i - 1] + 1);
  if (consecutivos && numeros.length > 2) return `Cubículos ${numeros[0]} a ${numeros[numeros.length - 1]}`;
  return `Cubículos ${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`;
}

export function textoDuracion(regla) {
  return regla.minHoras === regla.maxHoras ? `bloques de ${regla.minHoras} horas` : `de ${regla.minHoras} a ${regla.maxHoras} horas`;
}

export function sumarHoras(hora, horas) {
  return `${String(Number(hora.slice(0, 2)) + horas).padStart(2, '0')}:00`;
}

// Franjas consecutivas que ocuparía una reserva que empieza en `inicio` y dura `duracion` horas. Los horarios de reserva
// pueden tener huecos (la pausa del mediodía, por ejemplo), así que cada hora debe seguir exactamente a la anterior: si
// alguna falta, la reserva no cabe y la ventana que se devuelve es más corta que `duracion`.
export function ventanaDesde(horas, inicio, duracion) {
  const ventana = [];
  let actual = inicio;
  for (let i = 0; i < duracion && horas.includes(actual); i += 1) {
    ventana.push(actual);
    actual = sumarHoras(actual, 1);
  }
  return ventana;
}
