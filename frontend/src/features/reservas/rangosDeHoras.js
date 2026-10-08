// Cálculos de horas para reservar un cubículo eligiendo desde qué hora hasta qué hora. Las horas son horas enteras ("09:00") y los
// horarios de reserva pueden tener huecos (la pausa del mediodía, por ejemplo): una reserva es de horas seguidas, sin cruzar un hueco.

export function sumarHoras(hora, horas) {
  return `${String(Number(hora.slice(0, 2)) + horas).padStart(2, '0')}:00`;
}

export function horasEntre(inicio, fin) {
  return Number(fin.slice(0, 2)) - Number(inicio.slice(0, 2));
}

export function textoDeHoras(horas) {
  return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
}

// Horas finales posibles para una reserva que empieza en `inicio`: horas seguidas del horario del día (sin cruzar un hueco como la
// pausa del mediodía), hasta `maxHoras`. No mira si están ocupadas: eso se le avisa a la persona aparte, con las horas ya elegidas.
export function horasFinalesPosibles(horasDelDia, inicio, maxHoras) {
  const finales = [];
  let actual = inicio;
  for (let i = 0; i < maxHoras && horasDelDia.includes(actual); i += 1) {
    actual = sumarHoras(actual, 1);
    finales.push(actual);
  }
  return finales;
}

// Los tramos ya reservados que caen dentro de lo que se eligió, por ejemplo [["10:00", "12:00"]]. Las horas seguidas forman un tramo.
export function tramosOcupados(horasDelDia, ocupada, inicio, fin) {
  const tramos = [];
  horasDelDia
    .filter((hora) => hora >= inicio && hora < fin && ocupada(hora))
    .forEach((hora) => {
      const ultimo = tramos[tramos.length - 1];
      if (ultimo && ultimo[1] === hora) ultimo[1] = sumarHoras(hora, 1);
      else tramos.push([hora, sumarHoras(hora, 1)]);
    });
  return tramos;
}
