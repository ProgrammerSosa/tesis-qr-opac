// Estadísticas de uso de los servicios (propuesta, sección 4.5.7). Se calculan al pedirlas, a partir de las
// reservas, las solicitudes y el registro de eventos; no se guarda nada aparte.
const { listar: listarEventos } = require('../eventos/eventos_data');
const { listarReservas, franjasDeReserva } = require('../reservas/reservas_data');
const { listar: listarSolicitudes } = require('../solvencia/solvencia_data');
const { TESIS } = require('../catalog/catalog_data');
const { todasLasFranjas } = require('../horarios/horarios_data');

const DIAS_DE_LA_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDEN_DE_LOS_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function contar(eventos, tipo) {
  return eventos.filter((e) => e.tipo === tipo).length;
}

function calcular() {
  const eventos = listarEventos();
  const reservas = listarReservas();
  const solicitudes = listarSolicitudes();
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
