// Lectura de la hoja de cálculo del catálogo (CSV) para importarla desde el panel. Se interpreta en el navegador y al
// servidor solo se le envían las filas ya convertidas; él valida cada una.

// Separa el texto en filas y celdas. Acepta coma, punto y coma o tabulador, comillas dobles y saltos de línea dentro de comillas.
export function leerCsv(texto) {
  const limpio = String(texto).replace(/^﻿/, '');
  const primera = limpio.split(/\r?\n/, 1)[0] ?? '';
  const cuenta = (c) => (primera.match(new RegExp(c === '\t' ? '\\t' : `\\${c}`, 'g')) || []).length;
  const delimitador = [';', '\t', ','].reduce((mejor, c) => (cuenta(c) > cuenta(mejor) ? c : mejor), ',');

  const filas = [];
  let fila = [];
  let campo = '';
  let entreComillas = false;
  const cerrarFila = () => {
    fila.push(campo);
    campo = '';
    if (fila.some((celda) => celda.trim() !== '')) filas.push(fila);
    fila = [];
  };

  for (let i = 0; i < limpio.length; i += 1) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === delimitador) {
      fila.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i += 1;
      cerrarFila();
    } else {
      campo += c;
    }
  }
  if (campo !== '' || fila.length > 0) cerrarFila();
  return filas;
}

const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

// Nombres con los que puede venir cada columna (sin tildes ni espacios) y el campo del catálogo al que corresponden.
const ALIAS = {
  id: ['id', 'codigo', 'clasificacion', 'codigodelatesis', 'code'],
  titulo: ['titulo', 'title'],
  autor: ['autor', 'autora', 'author'],
  anio: ['anio', 'ano', 'year', 'aniodepublicacion', 'anopublicacion'],
  tipoDocumento: ['tipo', 'tipodocumento', 'tipodedocumento'],
  programa: ['programa', 'carrera'],
  director: ['director', 'directora', 'asesor', 'asesora'],
  paginas: ['paginas', 'pags', 'numerodepaginas'],
  temas: ['temas', 'tema', 'palabrasclave', 'materias'],
  resumen: ['resumen', 'abstract'],
  signatura: ['signatura', 'signaturatopografica'],
  institucion: ['institucion', 'universidad'],
  facultad: ['facultad'],
  coleccion: ['coleccion'],
  ubicacion: ['ubicacion'],
  estado: ['estado'],
  modalidadAcceso: ['modalidadacceso', 'modalidaddeacceso'],
  consultaFisica: ['consultafisica'],
};

const TIPOS = {
  tesis_grado: ['tesisgrado', 'tesisdegrado', 'grado', 'licenciatura'],
  tesis_posgrado: ['tesisposgrado', 'tesisdeposgrado', 'posgrado', 'maestria'],
  tesis_doctoral: ['tesisdoctoral', 'doctoral', 'doctorado'],
  seminario_posgrado: ['seminarioposgrado', 'seminariodeposgrado', 'seminario'],
};

function campoDeColumna(encabezado) {
  const limpio = normalizar(encabezado);
  return Object.keys(ALIAS).find((campo) => ALIAS[campo].includes(limpio)) ?? null;
}

function tipoDeDocumento(valor) {
  const limpio = normalizar(valor);
  return Object.keys(TIPOS).find((tipo) => normalizar(tipo) === limpio || TIPOS[tipo].includes(limpio)) ?? String(valor).trim();
}

// Convierte las filas del CSV en registros del catálogo según los encabezados de la primera fila. Devuelve las columnas
// que se reconocieron, las que no, y los registros.
export function filasDelCatalogo(filas) {
  if (filas.length < 2) return { columnas: [], ignoradas: [], registros: [] };
  const encabezados = filas[0].map((e) => ({ original: e.trim(), campo: campoDeColumna(e) }));
  const registros = filas.slice(1).map((celdas) => {
    const registro = {};
    encabezados.forEach(({ campo }, i) => {
      if (!campo) return;
      const valor = (celdas[i] ?? '').trim();
      if (valor === '') return;
      registro[campo] = campo === 'tipoDocumento' ? tipoDeDocumento(valor) : valor;
    });
    return registro;
  });
  return {
    columnas: [...new Set(encabezados.filter((e) => e.campo).map((e) => e.campo))],
    ignoradas: encabezados.filter((e) => !e.campo && e.original).map((e) => e.original),
    registros,
  };
}

// Lee un archivo (CSV o JSON con una lista de registros) y devuelve sus registros.
export async function leerArchivoDelCatalogo(archivo) {
  const texto = await archivo.text();
  if (/\.json$/i.test(archivo.name)) {
    const datos = JSON.parse(texto);
    const lista = Array.isArray(datos) ? datos : datos.tesis;
    if (!Array.isArray(lista)) throw new Error('El archivo JSON debe contener una lista de tesis');
    return { columnas: Object.keys(lista[0] ?? {}), ignoradas: [], registros: lista };
  }
  return filasDelCatalogo(leerCsv(texto));
}

export const PLANTILLA_CSV =
  'codigo,titulo,autor,anio,tipo,programa,director,paginas,temas,resumen,signatura\n' +
  'T14119,"Título completo de la tesis","Apellidos, Nombres",2022,grado,"Licenciatura en Ciencias Jurídicas y Sociales","Lic. Nombre Apellido",120,"Derecho civil; Conciliación","Resumen breve de la tesis.","T.DER 2022.119"\n';
