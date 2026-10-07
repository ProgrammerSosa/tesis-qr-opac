// Distribución de la sala de estudio. El mapa del frontend (studyRoomLayout.js) dibuja
// estos mismos identificadores, así que al agregar o quitar lugares hay que ajustar ambos.
const CUBICULOS = 6;
const ESTACIONES = 30; // puestos individuales, cada uno con una sola silla
const MESAS_SALA = 5;
const SILLAS_POR_MESA = 6;

// Reglas de reserva de cubículos. `cubiculos` son los números de cubículo habilitados para cada tipo.
// `maxDiarias` es el tope de horas por persona al día dentro de ese tipo de reserva.
const REGLAS_CUBICULO = {
  fases: { nombre: 'Preparación de fases', cubiculos: [1, 2, 3, 4], minHoras: 4, maxHoras: 8, maxDiarias: 8 },
  regular: { nombre: 'Estudio regular', cubiculos: [5, 6], minHoras: 2, maxHoras: 2, maxDiarias: 4 },
};

// Condiciones generales de uso (propuesta, sección 4.5.2): si quien reserva no se presenta dentro de la
// tolerancia, la reserva se libera y el lugar vuelve a estar disponible. Las estaciones y las sillas
// de la sala se reservan por una hora.
const CONDICIONES = { toleranciaMinutos: 15, duracionEspaciosHoras: 1 };

function modalidadesDelCubiculo(numero) {
  return Object.keys(REGLAS_CUBICULO).filter((clave) => REGLAS_CUBICULO[clave].cubiculos.includes(numero));
}

const RECURSOS = {
  cubiculo: Array.from({ length: CUBICULOS }, (_, i) => ({
    id: `cub-${i + 1}`,
    nombre: `Cubículo ${i + 1}`,
    capacidad: 5,
    modalidades: modalidadesDelCubiculo(i + 1),
  })),
  estacion: Array.from({ length: ESTACIONES }, (_, i) => ({
    id: `est-${i + 1}`,
    nombre: `Estación ${i + 1}`,
  })),
  sala_lectura: Array.from({ length: MESAS_SALA }, (_, m) =>
    Array.from({ length: SILLAS_POR_MESA }, (_, s) => ({
      id: `sala-m${m + 1}-s${s + 1}`,
      nombre: `Mesa ${m + 1} · Silla ${s + 1}`,
    }))
  ).flat(),
};

// Las horas en las que se puede reservar dependen del día de la semana y de los cierres: las define el administrador
// en los horarios (ver horarios/horarios_data.js).

module.exports = { RECURSOS, REGLAS_CUBICULO, CONDICIONES };
