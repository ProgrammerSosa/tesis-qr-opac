const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');
const { CONDICIONES } = require('../reservas/recursos_data');

// Ajustes generales que el administrador puede cambiar sin tocar el código (propuesta, sección 4.5.6:
// "configuración general"). Arrancan con los valores de recursos_data.js y se guardan en el almacén de datos.
const TIPOS_DE_RESERVA = ['cubiculo', 'estacion', 'sala_lectura'];
const TOLERANCIA_MINIMA = 5;
const TOLERANCIA_MAXIMA = 60;
const HORAS_MAXIMAS_DE_CUBICULO = 12; // el tope que el administrador puede fijar: más que eso ya no es una reserva de estudio

const NOMBRE_DEL_SERVICIO = { cubiculo: 'cubículos', estacion: 'estaciones', sala_lectura: 'la sala de lectura' };

const INICIAL = {
  toleranciaMinutos: CONDICIONES.toleranciaMinutos,
  cubiculoMaxHorasPorReserva: CONDICIONES.cubiculoMaxHorasPorReserva,
  cubiculoMaxHorasPorDia: CONDICIONES.cubiculoMaxHorasPorDia,
  reservasPausadas: Object.fromEntries(TIPOS_DE_RESERVA.map((tipo) => [tipo, false])),
  actualizadaEn: null,
  actualizadaPor: null,
};

// Lo guardado manda; lo que falte (por ejemplo un tipo de lugar nuevo) se completa con los valores iniciales.
const guardado = almacen.cargar('configuracion', INICIAL);
const estado = { ...INICIAL, ...guardado, reservasPausadas: { ...INICIAL.reservasPausadas, ...guardado.reservasPausadas } };

function obtener() {
  return {
    toleranciaMinutos: estado.toleranciaMinutos,
    cubiculoMaxHorasPorReserva: estado.cubiculoMaxHorasPorReserva,
    cubiculoMaxHorasPorDia: estado.cubiculoMaxHorasPorDia,
    reservasPausadas: { ...estado.reservasPausadas },
    actualizadaEn: estado.actualizadaEn,
    actualizadaPor: estado.actualizadaPor,
    limites: { toleranciaMinima: TOLERANCIA_MINIMA, toleranciaMaxima: TOLERANCIA_MAXIMA, horasMaximasDeCubiculo: HORAS_MAXIMAS_DE_CUBICULO },
  };
}

function toleranciaMinutos() {
  return estado.toleranciaMinutos;
}

// Topes de horas para los cubículos: por reserva y por persona al día.
function limitesDeCubiculo() {
  return { maxHorasPorReserva: estado.cubiculoMaxHorasPorReserva, maxHorasPorDia: estado.cubiculoMaxHorasPorDia };
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

// Valida todo antes de cambiar algo: o se aplican todos los cambios, o ninguno.
// Devuelve la configuración nueva y la lista de cambios hechos, para la bitácora.
function horasDeCubiculo(valor, actual, nombre) {
  if (valor === undefined) return actual;
  const horas = Number(valor);
  if (!Number.isInteger(horas) || horas < 1 || horas > HORAS_MAXIMAS_DE_CUBICULO) {
    throw rechazo(`${nombre} debe ser un número entero de 1 a ${HORAS_MAXIMAS_DE_CUBICULO} horas`);
  }
  return horas;
}

function actualizar(
  { toleranciaMinutos: tolerancia, reservasPausadas: pausas, cubiculoMaxHorasPorReserva: porReserva, cubiculoMaxHorasPorDia: porDia } = {},
  sesion
) {
  let nuevaTolerancia = estado.toleranciaMinutos;
  if (tolerancia !== undefined) {
    nuevaTolerancia = Number(tolerancia);
    if (!Number.isInteger(nuevaTolerancia) || nuevaTolerancia < TOLERANCIA_MINIMA || nuevaTolerancia > TOLERANCIA_MAXIMA) {
      throw rechazo(`La tolerancia debe ser un número entero de ${TOLERANCIA_MINIMA} a ${TOLERANCIA_MAXIMA} minutos`);
    }
  }

  const nuevoPorReserva = horasDeCubiculo(porReserva, estado.cubiculoMaxHorasPorReserva, 'El máximo de horas por reserva de cubículo');
  const nuevoPorDia = horasDeCubiculo(porDia, estado.cubiculoMaxHorasPorDia, 'El máximo de horas de cubículo por persona al día');
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
  if (nuevoPorReserva !== estado.cubiculoMaxHorasPorReserva) {
    cambios.push(`cubículos: máximo por reserva ${estado.cubiculoMaxHorasPorReserva} → ${nuevoPorReserva} h`);
  }
  if (nuevoPorDia !== estado.cubiculoMaxHorasPorDia) {
    cambios.push(`cubículos: máximo por persona al día ${estado.cubiculoMaxHorasPorDia} → ${nuevoPorDia} h`);
  }
  TIPOS_DE_RESERVA.forEach((tipo) => {
    if (nuevasPausas[tipo] !== estado.reservasPausadas[tipo]) {
      cambios.push(`reservas de ${NOMBRE_DEL_SERVICIO[tipo]} ${nuevasPausas[tipo] ? 'pausadas' : 'reanudadas'}`);
    }
  });

  if (cambios.length > 0) {
    estado.toleranciaMinutos = nuevaTolerancia;
    estado.cubiculoMaxHorasPorReserva = nuevoPorReserva;
    estado.cubiculoMaxHorasPorDia = nuevoPorDia;
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
  limitesDeCubiculo,
  reservasPausadas,
  tiposPausados,
  mensajeDePausa,
  actualizar,
};
