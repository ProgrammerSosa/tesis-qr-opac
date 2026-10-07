const { buscarReserva, cancelarReserva, liberarVencidas } = require('../reservas/reservas_data');
const { buscarSolicitud } = require('../solvencia/solvencia_data');
const { buscar: buscarTramite } = require('../tramites/tramites_data');
const { rechazo } = require('../../utils/errores');

// Seguimiento de lo que una persona hizo desde el sitio o un kiosco: con el número y el código de confirmación de su
// comprobante puede ver en qué estado está su reserva o su solicitud y, en el caso de una reserva, cancelarla.
// Siempre se responde lo mismo si el número no existe o el código no corresponde, para que nadie pueda ir probando números.
const NO_ENCONTRADA = 'No encontramos nada con ese número y ese código. Revisa que los hayas escrito como aparecen en tu comprobante.';

// Acepta "r-7", "R 007", "sol-12", "td-001"... y lo deja como lo guarda el sistema ("R-007").
function normalizarNumero(texto) {
  const coincidencia = /^(R|SOL|TD|REF)[\s-]*(\d{1,6})$/.exec(String(texto ?? '').trim().toUpperCase());
  return coincidencia ? `${coincidencia[1]}-${coincidencia[2].padStart(3, '0')}` : null;
}

function buscarRegistro(numero) {
  if (numero.startsWith('R-')) {
    liberarVencidas(); // si ya pasó su tiempo de tolerancia, la reserva se muestra como liberada
    return { origen: 'reserva', registro: buscarReserva(numero) };
  }
  if (numero.startsWith('SOL-')) return { origen: 'solvencia', registro: buscarSolicitud(numero) };
  return { origen: 'tramite', registro: buscarTramite(numero) };
}

// Lo que se muestra a quien consulta: lo que la persona ya conoce de su operación, sin datos de contacto ni de gestión interna.
function vista({ origen, registro }) {
  const base = { id: registro.id, estado: registro.estado, creadoEn: registro.creadoEn, atendidaEn: registro.atendidaEn ?? null };
  if (origen === 'reserva') {
    return {
      ...base,
      tipo: 'reserva',
      puedeCancelar: registro.estado === 'reservado',
      motivoLiberacion: registro.motivoLiberacion ?? null,
      detalle: {
        nombre: registro.solicitante,
        espacio: registro.recursoNombre,
        tipoDeReserva: registro.modalidadNombre ?? null,
        fecha: registro.fecha,
        hora: registro.hora,
        horaFin: registro.horaFin,
        duracion: registro.duracion,
      },
    };
  }
  if (origen === 'solvencia') {
    return {
      ...base,
      tipo: 'solvencia',
      observacion: registro.observacion ?? null,
      detalle: {
        nombre: registro.solicitante,
        motivo: registro.motivo,
        fechaPapeleria: registro.fechaPapeleria ?? null,
        entregaEstimada: registro.entregaEstimada ?? null,
      },
    };
  }
  return {
    ...base,
    tipo: registro.tipo,
    observacion: registro.observacion ?? null,
    tesisId: registro.tesisId ?? null,
    detalle:
      registro.tipo === 'tesis_digital'
        ? { nombre: registro.solicitante, titulo: registro.titulo, autor: registro.autor, clasificacion: registro.clasificacion, nivel: registro.nivel, anio: registro.anio }
        : { nombre: registro.solicitante, tema: registro.tema, fuente: registro.fuente },
  };
}

function encontrar(numero, codigo) {
  const normalizado = normalizarNumero(numero);
  const codigoLimpio = String(codigo ?? '').trim().toUpperCase();
  if (!normalizado || !codigoLimpio) throw rechazo(NO_ENCONTRADA, 404);
  const encontrado = buscarRegistro(normalizado);
  if (!encontrado.registro || encontrado.registro.codigoConfirmacion !== codigoLimpio) throw rechazo(NO_ENCONTRADA, 404);
  return encontrado;
}

function consultar(numero, codigo) {
  return vista(encontrar(numero, codigo));
}

// Cancela una reserva que todavía no empezó a usarse; el lugar queda libre para otra persona.
function cancelarMiReserva(numero, codigo) {
  const encontrado = encontrar(numero, codigo);
  if (encontrado.origen !== 'reserva') throw rechazo('Solo se pueden cancelar reservas de lugares de estudio', 409);
  if (encontrado.registro.estado !== 'reservado') {
    throw rechazo('Esta reserva ya no se puede cancelar: ya se usó, ya se canceló o el lugar ya se liberó', 409);
  }
  cancelarReserva(encontrado.registro.id);
  return vista(encontrado);
}

module.exports = { normalizarNumero, consultar, cancelarMiReserva };
