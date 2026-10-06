const TESIS = [
  {
    id: 'T-2024-00123',
    titulo: 'La conciliación extrajudicial como mecanismo de descongestión en los procesos de familia',
    autor: 'Mariana Fonseca Ríos',
    programa: 'Derecho',
    facultad: 'Facultad de Ciencias Jurídicas',
    director: 'Dr. Camilo Restrepo Vega',
    anio: '2024',
    paginas: 118,
    modalidad: 'Monografía de grado',
    temas: ['Derecho civil', 'Conciliación', 'Procesos de familia'],
    resumen:
      'Analiza el uso de la conciliación extrajudicial como vía para reducir la carga procesal de los juzgados de familia, con base en expedientes de tres centros de conciliación entre 2019 y 2023.',
    ubicacion: 'Biblioteca central',
    coleccion: 'Sala de tesis — Derecho',
    signatura: 'T.DER 2024.123',
    estado: 'Disponible',
  },
  {
    id: 'T-2023-00098',
    titulo: 'La mediación familiar frente a la conciliación en equidad',
    autor: 'J. Ariza Londoño',
    programa: 'Derecho',
    facultad: 'Facultad de Ciencias Jurídicas',
    director: 'Dra. Paola Jiménez Ruiz',
    anio: '2023',
    paginas: 96,
    modalidad: 'Monografía de grado',
    temas: ['Derecho civil', 'Mediación'],
    resumen: 'Compara la mediación familiar y la conciliación en equidad como mecanismos alternativos de resolución de conflictos.',
    ubicacion: 'Biblioteca central',
    coleccion: 'Sala de tesis — Derecho',
    signatura: 'T.DER 2023.098',
    estado: 'Disponible',
  },
  {
    id: 'T-2022-00071',
    titulo: 'Descongestión judicial en los juzgados de familia de Bogotá',
    autor: 'L. Peña Morales',
    programa: 'Derecho',
    facultad: 'Facultad de Ciencias Jurídicas',
    director: 'Dr. Camilo Restrepo Vega',
    anio: '2022',
    paginas: 104,
    modalidad: 'Monografía de grado',
    temas: ['Derecho civil', 'Descongestión judicial'],
    resumen: 'Estudio estadístico sobre la congestión de los despachos de familia en Bogotá entre 2017 y 2021.',
    ubicacion: 'Biblioteca central',
    coleccion: 'Sala de tesis — Derecho',
    signatura: 'T.DER 2022.071',
    estado: 'Disponible',
  },
  {
    id: 'T-2023-00114',
    titulo: 'Centros de conciliación universitarios: balance 2015–2023',
    autor: 'D. Quintero Salas',
    programa: 'Derecho',
    facultad: 'Facultad de Ciencias Jurídicas',
    director: 'Dra. Paola Jiménez Ruiz',
    anio: '2023',
    paginas: 88,
    modalidad: 'Monografía de grado',
    temas: ['Conciliación', 'Clínica jurídica'],
    resumen: 'Balance del funcionamiento de los centros de conciliación universitarios en Colombia durante los últimos ocho años.',
    ubicacion: 'Biblioteca central',
    coleccion: 'Sala de tesis — Derecho',
    signatura: 'T.DER 2023.114',
    estado: 'Disponible',
  },
];

function buscarTesis({ autor = '', titulo = '', anio = '', tema = '' } = {}) {
  const norm = (v) => String(v).trim().toLowerCase();
  return TESIS.filter((t) => {
    if (autor && !norm(t.autor).includes(norm(autor))) return false;
    if (titulo && !norm(t.titulo).includes(norm(titulo))) return false;
    if (anio && t.anio !== String(anio).trim()) return false;
    if (tema && !t.temas.some((x) => norm(x).includes(norm(tema)))) return false;
    return true;
  });
}

function obtenerPorId(id) {
  return TESIS.find((t) => t.id === id) || null;
}

function tesisRelacionadas(tesis, limite = 3) {
  return TESIS.filter((t) => t.id !== tesis.id && t.temas.some((tema) => tesis.temas.includes(tema))).slice(0, limite);
}

module.exports = { TESIS, buscarTesis, obtenerPorId, tesisRelacionadas };
