const almacen = require('../../utils/almacen');
const { rechazo } = require('../../utils/errores');
const { aMinutos, diaDeLaSemana, esFechaISO, sumarDias } = require('../../utils/fechas');

// Horarios del servicio de reservas: las ventanas en las que se pueden reservar lugares de estudio (cubículos, estaciones y
// sala de lectura) y los días de cierre (asuetos, vacaciones, inventario). El administrador los cambia desde el panel; aquí
// solo se guardan y se consultan. Cada tramo es [desde, hasta] en hora y minutos ("08:00").
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']; // la posición es Date.getDay()
const NOMBRE_DEL_DIA = {
  domingo: 'Domingo',
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

const FORMATO_DE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAXIMO_DE_TRAMOS = 3;
const MAXIMO_DE_CIERRES = 300;

// Con lo que arranca el sistema: los horarios de reserva que publica la biblioteca en su sitio web.
const entreSemana = (tramos) =>
  Object.fromEntries(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => [dia, tramos.map((tramo) => [...tramo])]));
const INICIAL = {
  reservas: {
    ...entreSemana([
      ['08:00', '12:50'],
      ['13:10', '19:15'],
    ]),
    sabado: [
      ['08:00', '12:50'],
      ['12:55', '17:50'],
    ],
    domingo: [['08:00', '12:50']],
  },
  cierres: [], // { id, desde, hasta, motivo }
  contadorDeCierres: 0,
};

const estado = almacen.cargar('horarios', INICIAL);
delete estado.atencion; // los datos guardados por versiones anteriores traían también el horario de atención: ya no se usa

// --- Cierres ---------------------------------------------------------------------------------------------------------

function cierreDe(fecha) {
  return estado.cierres.find((c) => c.desde <= fecha && fecha <= c.hasta) || null;
}

function listarCierres() {
  return estado.cierres.slice().sort((a, b) => a.desde.localeCompare(b.desde));
}

function agregarCierre({ desde, hasta, motivo }) {
  if (!esFechaISO(desde) || !esFechaISO(hasta)) {
    throw rechazo('Indica las fechas del cierre');
  }
  if (hasta < desde) {
    throw rechazo('La fecha final no puede ser anterior a la inicial');
  }
  const texto = String(motivo ?? '').trim();
  if (texto.length < 3 || texto.length > 120) {
    throw rechazo('Escribe el motivo del cierre (de 3 a 120 caracteres)');
  }
  if (estado.cierres.length >= MAXIMO_DE_CIERRES) {
    throw rechazo('Hay demasiados cierres registrados: elimina los que ya pasaron', 409);
  }
  estado.contadorDeCierres += 1;
  const cierre = { id: `C-${String(estado.contadorDeCierres).padStart(3, '0')}`, desde, hasta, motivo: texto };
  estado.cierres.push(cierre);
  almacen.guardar('horarios', estado);
  return cierre;
}

function quitarCierre(id) {
  const posicion = estado.cierres.findIndex((c) => c.id === id);
  if (posicion === -1) return null;
  const [quitado] = estado.cierres.splice(posicion, 1);
  almacen.guardar('horarios', estado);
  return quitado;
}

// --- Tramos de cada día ----------------------------------------------------------------------------------------------

function validarTramos(dia, tramos) {
  const nombre = NOMBRE_DEL_DIA[dia];
  if (!Array.isArray(tramos) || tramos.length > MAXIMO_DE_TRAMOS) {
    throw rechazo(`${nombre}: indica hasta ${MAXIMO_DE_TRAMOS} tramos de horario`);
  }
  const limpios = tramos.map((tramo) => {
    if (!Array.isArray(tramo) || tramo.length !== 2 || !FORMATO_DE_HORA.test(tramo[0]) || !FORMATO_DE_HORA.test(tramo[1])) {
      throw rechazo(`${nombre}: escribe las horas así, 08:00`);
    }
    if (aMinutos(tramo[0]) >= aMinutos(tramo[1])) {
      throw rechazo(`${nombre}: la hora de cierre debe ser posterior a la de apertura`);
    }
    return [tramo[0], tramo[1]];
  });
  limpios.sort((a, b) => aMinutos(a[0]) - aMinutos(b[0]));
  for (let i = 1; i < limpios.length; i += 1) {
    if (aMinutos(limpios[i][0]) < aMinutos(limpios[i - 1][1])) {
      throw rechazo(`${nombre}: los tramos no pueden cruzarse`);
    }
  }
  return limpios;
}

function validarSemana(semana, seccion) {
  if (typeof semana !== 'object' || semana === null) {
    throw rechazo(`Faltan los horarios de ${seccion}`);
  }
  return Object.fromEntries(DIAS.map((dia) => [dia, validarTramos(dia, semana[dia] ?? [])]));
}

// Reemplaza los horarios de reservas. Valida todo antes de cambiar nada.
function actualizar({ reservas } = {}) {
  const nuevasReservas = validarSemana(reservas, 'reservas');
  estado.reservas = nuevasReservas;
  almacen.guardar('horarios', estado);
  return obtener();
}

function obtener() {
  return { reservas: estado.reservas, cierres: listarCierres() };
}

// --- Consultas -------------------------------------------------------------------------------------------------------

function ventanasDeReserva(fecha) {
  return cierreDe(fecha) ? [] : estado.reservas[DIAS[diaDeLaSemana(fecha)]] ?? [];
}

// Horas de inicio ("08:00") en las que se puede reservar un lugar ese día: las horas enteras que caben completas dentro
// de una ventana de reservas. Con la ventana 13:10-19:15, por ejemplo, la primera hora posible es 14:00 y la última 18:00.
function franjasDeReserva(fecha) {
  const franjas = [];
  ventanasDeReserva(fecha).forEach(([desde, hasta]) => {
    for (let hora = Math.ceil(aMinutos(desde) / 60); (hora + 1) * 60 <= aMinutos(hasta); hora += 1) {
      franjas.push(`${String(hora).padStart(2, '0')}:00`);
    }
  });
  return franjas;
}

// Todas las horas de inicio que existen en algún día de la semana (para las gráficas de demanda).
function todasLasFranjas() {
  const horas = new Set();
  DIAS.forEach((dia) => {
    (estado.reservas[dia] ?? []).forEach(([desde, hasta]) => {
      for (let hora = Math.ceil(aMinutos(desde) / 60); (hora + 1) * 60 <= aMinutos(hasta); hora += 1) {
        horas.add(`${String(hora).padStart(2, '0')}:00`);
      }
    });
  });
  return [...horas].sort();
}

// Día hábil: de lunes a viernes y que no sea un día de cierre. Las solvencias solo se entregan en días hábiles.
function esDiaHabil(fecha) {
  const dia = diaDeLaSemana(fecha);
  return dia >= 1 && dia <= 5 && !cierreDe(fecha);
}

function siguienteDiaHabil(fecha) {
  let candidato = sumarDias(fecha, 1);
  for (let i = 0; i < 400 && !esDiaHabil(candidato); i += 1) candidato = sumarDias(candidato, 1);
  return candidato;
}

// Lo que se necesita saber de un día concreto para reservar: si hay servicio, por qué no, y a qué horas se puede reservar.
function resumenDelDia(fecha) {
  const cierre = cierreDe(fecha);
  return {
    fecha,
    dia: NOMBRE_DEL_DIA[DIAS[diaDeLaSemana(fecha)]],
    cerrado: Boolean(cierre),
    motivo: cierre ? cierre.motivo : null,
    ventanasDeReserva: ventanasDeReserva(fecha),
    franjas: franjasDeReserva(fecha),
  };
}

module.exports = {
  DIAS,
  NOMBRE_DEL_DIA,
  obtener,
  actualizar,
  listarCierres,
  agregarCierre,
  quitarCierre,
  cierreDe,
  franjasDeReserva,
  todasLasFranjas,
  esDiaHabil,
  siguienteDiaHabil,
  resumenDelDia,
};
