const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');
const { CONDICIONES } = require('../reservas/recursos_data');

// Ajustes generales que el administrador puede cambiar sin tocar el código (propuesta, sección 4.5.6:
// "configuración general"). Arrancan con los valores de recursos_data.js y se guardan en el almacén de datos.
const TIPOS_DE_RESERVA = ['cubiculo', 'estacion', 'sala_lectura'];
const TOLERANCIA_MINIMA = 5;
const TOLERANCIA_MAXIMA = 60;
const HORAS_MAXIMAS = 12; // el tope que el administrador puede fijar: más que eso ya no es una reserva de estudio

const NOMBRE_DEL_SERVICIO = { cubiculo: 'cubículos', estacion: 'estaciones', sala_lectura: 'la sala de lectura' };

const INICIAL = {
  toleranciaMinutos: CONDICIONES.toleranciaMinutos,
  maxHorasPorReserva: CONDICIONES.maxHorasPorReserva,
  maxHorasPorDia: CONDICIONES.maxHorasPorDia,
  reservasPausadas: Object.fromEntries(TIPOS_DE_RESERVA.map((tipo) => [tipo, false])),
  actualizadaEn: null,
  actualizadaPor: null,
};

// Lo guardado manda; lo que falte (por ejemplo un tipo de lugar nuevo) se completa con los valores iniciales.
const guardado = almacen.cargar('configuracion', INICIAL);
const estado = { ...INICIAL, ...guardado, reservasPausadas: { ...INICIAL.reservasPausadas, ...guardado.reservasPausadas } };
// Los topes de horas se llamaban «cubiculoMaxHorasPor...» cuando solo valían para los cubículos: se conservan los valores guardados.
if (guardado.maxHorasPorReserva === undefined && guardado.cubiculoMaxHorasPorReserva !== undefined) {
  estado.maxHorasPorReserva = guardado.cubiculoMaxHorasPorReserva;
}
if (guardado.maxHorasPorDia === undefined && guardado.cubiculoMaxHorasPorDia !== undefined) {
  estado.maxHorasPorDia = guardado.cubiculoMaxHorasPorDia;
}
delete estado.cubiculoMaxHorasPorReserva;
delete estado.cubiculoMaxHorasPorDia;

function obtener() {
  return {
    toleranciaMinutos: estado.toleranciaMinutos,
    maxHorasPorReserva: estado.maxHorasPorReserva,
    maxHorasPorDia: estado.maxHorasPorDia,
    reservasPausadas: { ...estado.reservasPausadas },
    actualizadaEn: estado.actualizadaEn,
    actualizadaPor: estado.actualizadaPor,
    limites: { toleranciaMinima: TOLERANCIA_MINIMA, toleranciaMaxima: TOLERANCIA_MAXIMA, horasMaximas: HORAS_MAXIMAS },
  };
}

function toleranciaMinutos() {
  return estado.toleranciaMinutos;
}

// Topes de horas de las reservas (valen para todos los lugares de estudio): por reserva y por persona al día.
function limitesDeHoras() {
  return { maxHorasPorReserva: estado.maxHorasPorReserva, maxHorasPorDia: estado.maxHorasPorDia };
}

function reservasPausadas(tipo) {
  return estado.reservasPausadas[tipo] === true;
}

function tiposPausados() {
  return TIPOS_DE_RESERVA.filter(reservasPausadas);
}

function mensajeDePausa(tipo) {
  return `Las reservas de ${NOMBRE_DEL_SERVICIO[tipo]} están pausadas temporalmente. Consulta en el mostrador de la biblioteca.`;
}

function horasDeReserva(valor, actual, nombre) {
  if (valor === undefined) return actual;
  const horas = Number(valor);
  if (!Number.isInteger(horas) || horas < 1 || horas > HORAS_MAXIMAS) {
    throw rechazo(`${nombre} debe ser un número entero de 1 a ${HORAS_MAXIMAS} horas`);
  }
  return horas;
}

// Valida todo antes de cambiar algo: o se aplican todos los cambios, o ninguno.
// Devuelve la configuración nueva y la lista de cambios hechos, para la bitácora.
function actualizar(
  { toleranciaMinutos: tolerancia, reservasPausadas: pausas, maxHorasPorReserva: porReserva, maxHorasPorDia: porDia } = {},
  sesion
) {
  let nuevaTolerancia = estado.toleranciaMinutos;
  if (tolerancia !== undefined) {
    nuevaTolerancia = Number(tolerancia);
    if (!Number.isInteger(nuevaTolerancia) || nuevaTolerancia < TOLERANCIA_MINIMA || nuevaTolerancia > TOLERANCIA_MAXIMA) {
      throw rechazo(`La tolerancia debe ser un número entero de ${TOLERANCIA_MINIMA} a ${TOLERANCIA_MAXIMA} minutos`);
    }
  }

  const nuevoPorReserva = horasDeReserva(porReserva, estado.maxHorasPorReserva, 'El máximo de horas por reserva');
  const nuevoPorDia = horasDeReserva(porDia, estado.maxHorasPorDia, 'El máximo de horas por persona al día');
  if (nuevoPorDia < nuevoPorReserva) {
    throw rechazo('El máximo por persona al día no puede ser menor que el máximo por reserva');
  }

  const nuevasPausas = { ...estado.reservasPausadas };
  if (pausas !== undefined) {
    if (typeof pausas !== 'object' || pausas === null || Array.isArray(pausas)) {
      throw rechazo('Indica qué reservas quedan pausadas');
    }
    Object.entries(pausas).forEach(([tipo, pausada]) => {
      if (!TIPOS_DE_RESERVA.includes(tipo) || typeof pausada !== 'boolean') {
        throw rechazo('Los datos de pausa no son válidos');
      }
      nuevasPausas[tipo] = pausada;
    });
  }

  const cambios = [];
  if (nuevaTolerancia !== estado.toleranciaMinutos) {
    cambios.push(`tolerancia ${estado.toleranciaMinutos} → ${nuevaTolerancia} min`);
  }
  if (nuevoPorReserva !== estado.maxHorasPorReserva) {
    cambios.push(`horas por reserva: máximo ${estado.maxHorasPorReserva} → ${nuevoPorReserva} h`);
  }
  if (nuevoPorDia !== estado.maxHorasPorDia) {
    cambios.push(`horas por persona al día: máximo ${estado.maxHorasPorDia} → ${nuevoPorDia} h`);
  }
  TIPOS_DE_RESERVA.forEach((tipo) => {
    if (nuevasPausas[tipo] !== estado.reservasPausadas[tipo]) {
      cambios.push(`reservas de ${NOMBRE_DEL_SERVICIO[tipo]} ${nuevasPausas[tipo] ? 'pausadas' : 'reanudadas'}`);
    }
  });

  if (cambios.length > 0) {
    estado.toleranciaMinutos = nuevaTolerancia;
    estado.maxHorasPorReserva = nuevoPorReserva;
    estado.maxHorasPorDia = nuevoPorDia;
    estado.reservasPausadas = nuevasPausas;
    estado.actualizadaEn = new Date().toISOString();
    estado.actualizadaPor = sesion?.usuario ?? null;
    almacen.guardar('configuracion', estado);
  }
  return { configuracion: obtener(), cambios };
}

module.exports = {
  TIPOS_DE_RESERVA,
  obtener,
  toleranciaMinutos,
  limitesDeHoras,
  reservasPausadas,
  tiposPausados,
  mensajeDePausa,
  actualizar,
};
