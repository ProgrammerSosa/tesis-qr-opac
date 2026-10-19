// Estadísticas de uso de los servicios (propuesta, sección 4.5.7). Se calculan al pedirlas, a partir de las
// reservas, las solicitudes y el registro de eventos; no se guarda nada aparte.
//
// El administrador elige el período: un día, una semana, un mes, un año, todo o un rango de fechas (`desde` y `hasta`, ambos
// incluidos). Las reservas cuentan por el día en que se usa el lugar; las solicitudes y los eventos (búsquedas, consultas, accesos
// por QR, comprobantes, sesiones de kiosco), por el día en que ocurrieron, en hora de la biblioteca.
const { listar: listarEventos } = require('../eventos/eventos_data');
const { listarReservas, franjasDeReserva } = require('../reservas/reservas_data');
const { listar: listarSolicitudes } = require('../solvencia/solvencia_data');
const { TESIS } = require('../catalog/catalog_data');
const { todasLasFranjas } = require('../horarios/horarios_data');
const { rechazo } = require('../../utils/errores');
const { esFechaISO, fechaLocal } = require('../../utils/fechas');

const DIAS_DE_LA_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDEN_DE_LOS_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function contar(eventos, tipo) {
  return eventos.filter((e) => e.tipo === tipo).length;
}

// Valida el período pedido. Sin fechas es todo lo registrado; con una sola, ese lado queda abierto.
function periodo({ desde, hasta } = {}) {
  const limpio = (valor, nombre) => {
    if (valor === undefined || valor === null || valor === '') return null;
    if (!esFechaISO(String(valor))) throw rechazo(`La fecha «${nombre}» no es válida: escríbela así, 2026-10-19`);
    return String(valor);
  };
  const inicio = limpio(desde, 'desde');
  const fin = limpio(hasta, 'hasta');
  if (inicio && fin && fin < inicio) throw rechazo('La fecha final no puede ser anterior a la inicial');
  return { desde: inicio, hasta: fin };
}

// Cómo terminaron las reservas del período: el personal ve cuántas se usaron y cuántas personas no llegaron.
function resultadoDeLasReservas(reservas) {
  const cuantas = (condicion) => reservas.filter(condicion).length;
  return {
    total: reservas.length,
    atendidas: cuantas((r) => r.estado === 'finalizado' || r.estado === 'en_uso'),
    pendientes: cuantas((r) => r.estado === 'reservado'),
    noSePresentaron: cuantas((r) => r.estado === 'liberada' && r.motivoLiberacion === 'no_presentado'),
    liberadasPorElPersonal: cuantas((r) => r.estado === 'liberada' && r.motivoLiberacion !== 'no_presentado'),
    canceladas: cuantas((r) => r.estado === 'cancelado'),
    penalizaciones: cuantas((r) => Boolean(r.penalizadoHasta)),
    horasReservadas: reservas.filter((r) => r.estado !== 'cancelado').reduce((total, r) => total + (Number(r.duracion) || 0), 0),
  };
}

function calcular(filtro) {
  const { desde, hasta } = periodo(filtro);
  const dentro = (fecha) => (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
  const ocurrioDentro = (x) => dentro(fechaLocal(new Date(x.creadoEn)));

  const eventos = listarEventos().filter(ocurrioDentro);
  const reservas = listarReservas().filter((r) => dentro(r.fecha));
  const solicitudes = listarSolicitudes().filter(ocurrioDentro);
  const reservasVigentes = reservas.filter((r) => r.estado !== 'cancelado');

  // Demanda por hora: cada reserva suma una vez en cada hora que ocupa.
  const porHora = todasLasFranjas().map((hora) => ({
    hora,
    total: reservasVigentes.filter((r) => franjasDeReserva(r).includes(hora)).length,
  }));

  const porDia = ORDEN_DE_LOS_DIAS.map((dia) => ({
    dia,
    total: reservasVigentes.filter((r) => DIAS_DE_LA_SEMANA[new Date(`${r.fecha}T12:00:00`).getDay()] === dia).length,
  }));

  const tesisMasConsultadas = TESIS.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    consultas: eventos.filter((e) => e.tesisId === t.id && (e.tipo === 'consulta_digital' || e.tipo === 'descarga_digital')).length,
    accesosQr: eventos.filter((e) => e.tesisId === t.id && e.tipo === 'acceso_qr').length,
  }))
    .filter((t) => t.consultas + t.accesosQr > 0)
    .sort((a, b) => b.consultas + b.accesosQr - (a.consultas + a.accesosQr))
    .slice(0, 5);

  const kioscos = [...new Set(eventos.filter((e) => e.tipo === 'sesion_kiosco' && e.kiosco).map((e) => e.kiosco))]
    .sort()
    .map((kiosco) => ({
      kiosco,
      sesiones: eventos.filter((e) => e.tipo === 'sesion_kiosco' && e.kiosco === kiosco).length,
      operaciones: [...reservas, ...solicitudes].filter((x) => x.kiosco === kiosco).length,
    }));

  return {
    generadoEn: new Date().toISOString(),
    periodo: { desde, hasta },
    totales: {
      busquedasOpac: contar(eventos, 'busqueda_opac'),
      consultasDigitales: contar(eventos, 'consulta_digital'),
      descargasDigitales: contar(eventos, 'descarga_digital'),
      accesosQr: contar(eventos, 'acceso_qr'),
      reservasCubiculos: reservas.filter((r) => r.tipo === 'cubiculo').length,
      reservasEspacios: reservas.filter((r) => r.tipo !== 'cubiculo').length,
      solicitudesSolvencia: solicitudes.length,
      sesionesKiosco: contar(eventos, 'sesion_kiosco'),
    },
    reservas: resultadoDeLasReservas(reservas),
    comprobantes: {
      generados: reservas.length + solicitudes.length,
      impresos: contar(eventos, 'comprobante_impreso'),
      porCorreo: contar(eventos, 'comprobante_correo'),
    },
    porHora,
    porDia,
    tesisMasConsultadas,
    kioscos,
  };
}

module.exports = { calcular };
