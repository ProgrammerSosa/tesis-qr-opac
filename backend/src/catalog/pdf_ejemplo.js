const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');
const biblioteca = require('../../utils/biblioteca');

// Documento digital de ejemplo de una tesis. Mientras la biblioteca no cargue el archivo digitalizado real (la URL de la tesis, en el
// panel), el sistema arma este PDF con los datos del catálogo: portada, ficha, resumen, cómo citar y condiciones de uso. Sirve para
// consultar, descargar y probar todo el recorrido (visor, niveles de acceso, código QR) sin depender de archivos externos.

const LOGO = path.join(__dirname, '..', '..', 'assets', 'logo-biblioteca.png');

// Colores de la biblioteca (los mismos del sitio).
const AZUL = '#1e40af';
const AZUL_OSCURO = '#0a1233';
const ROJO = '#dc2626';
const TINTA = '#0f172a';
const GRIS = '#64748b';
const LINEA = '#e2e8f0';
const FONDO = '#f1f5f9';

const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN = 60;
const ANCHO_UTIL = ANCHO - MARGEN * 2;
const LIMITE_INFERIOR = ALTO - 78; // hasta aquí llega el contenido; debajo va el pie de página

const ACCESOS = {
  acceso_descarga: {
    etiqueta: 'Acceso y descarga',
    resumen: 'Se puede consultar en línea, descargar y guardar para uso académico.',
    condicion: 'Este documento se puede consultar en línea, descargar y guardar para uso académico y personal.',
  },
  consulta: {
    etiqueta: 'Solo consulta',
    resumen: 'Se puede consultar en línea; no se ofrece la descarga ni la reproducción.',
    condicion: 'Este documento solo se puede consultar en línea. La biblioteca no ofrece su descarga ni su reproducción.',
  },
};

const TIPOS = {
  tesis_grado: 'Tesis de grado',
  tesis_posgrado: 'Tesis de posgrado',
  tesis_doctoral: 'Tesis doctoral',
  seminario_posgrado: 'Seminario de posgrado',
};

function recortar(texto, maximo) {
  const limpio = String(texto ?? '').replace(/\s+/g, ' ').trim();
  return limpio.length > maximo ? `${limpio.slice(0, maximo - 1).trimEnd()}…` : limpio;
}

// Tamaño del título de la portada según su largo, para que siempre quepa bien.
function tamanoDelTitulo(titulo) {
  if (titulo.length <= 80) return 28;
  if (titulo.length <= 140) return 24;
  if (titulo.length <= 220) return 20;
  return 17;
}

function pdfDeTesis(tesis, acceso, { enlace } = {}) {
  return new Promise((resolve, reject) => {
    const nivel = ACCESOS[acceso] ?? ACCESOS.consulta;
    const soloConsulta = acceso !== 'acceso_descarga';
    const tipo = TIPOS[tesis.tipoDocumento] ?? tesis.modalidad ?? 'Tesis';
    const temas = Array.isArray(tesis.temas) ? tesis.temas : [];

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 70, bottom: 70, left: MARGEN, right: MARGEN },
      bufferPages: true,
      displayTitle: true,
      lang: 'es',
      info: {
        Title: tesis.titulo,
        Author: tesis.autor,
        Subject: `${tipo} · ${tesis.institucion}`,
        Keywords: temas.join(', '),
        Creator: biblioteca.nombre,
        Producer: 'Sistema de autoservicio de la biblioteca',
      },
    });

    const trozos = [];
    doc.on('data', (trozo) => trozos.push(trozo));
    doc.on('end', () => resolve(Buffer.concat(trozos)));
    doc.on('error', reject);

    // --- Piezas comunes ---------------------------------------------------------------------------------------------

    // Con «solo consulta», una marca de agua en diagonal cruza cada página (se dibuja debajo del contenido).
    function marcaDeAgua() {
      if (!soloConsulta) return;
      doc.save();
      doc.rotate(-38, { origin: [ANCHO / 2, ALTO / 2] });
      doc.fillColor(AZUL).fillOpacity(0.08).font('Helvetica-Bold').fontSize(64);
      doc.text('SOLO CONSULTA', 0, ALTO / 2 - 32, { width: ANCHO, align: 'center', lineBreak: false });
      doc.restore();
      doc.fillOpacity(1);
    }
    doc.on('pageAdded', () => {
      marcaDeAgua();
      doc.x = MARGEN;
      doc.y = doc.page.margins.top;
    });
    marcaDeAgua();

    // Título de una sección: en serif, con un trazo rojo debajo (como en el sitio).
    function titulo(texto, y = doc.page.margins.top) {
      doc.font('Times-Bold').fontSize(24).fillColor(TINTA).text(texto, MARGEN, y, { width: ANCHO_UTIL });
      const bajo = doc.y + 6;
      doc.rect(MARGEN, bajo, 44, 3).fill(ROJO);
      doc.y = bajo + 24;
      doc.x = MARGEN;
    }

    function subtitulo(texto) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(ROJO).text(texto.toUpperCase(), MARGEN, doc.y, { width: ANCHO_UTIL, characterSpacing: 2 });
      doc.moveDown(0.6);
      doc.x = MARGEN;
    }

    // --- Portada ---------------------------------------------------------------------------------------------------

    const alturaDeLaFranja = 214;
    const degradado = doc.linearGradient(0, 0, ANCHO, alturaDeLaFranja);
    degradado.stop(0, AZUL).stop(1, AZUL_OSCURO);
    doc.rect(0, 0, ANCHO, alturaDeLaFranja).fill(degradado);
    // Un resplandor rojo en la esquina, como en el encabezado del sitio.
    doc.save();
    doc.rect(0, 0, ANCHO, alturaDeLaFranja).clip();
    doc.circle(ANCHO - 30, alturaDeLaFranja + 20, 150).fillOpacity(0.28).fill(ROJO);
    doc.restore();
    doc.fillOpacity(1);
    doc.rect(0, alturaDeLaFranja, ANCHO, 5).fill(ROJO);

    if (fs.existsSync(LOGO)) {
      doc.image(LOGO, 56, 46, { fit: [88, 106] });
    }
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text(biblioteca.nombre, 166, 54, { width: 370 });
    doc.font('Helvetica').fontSize(11).fillColor('#bfdbfe').text(tesis.facultad, 166, doc.y + 8, { width: 370 });
    doc.fillColor('#bfdbfe').text(tesis.institucion, 166, doc.y + 2, { width: 370 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#dbeafe').text('ACERVO DIGITAL DE TESIS', 166, 146, { width: 370, characterSpacing: 1.5 });

    // Tipo de documento, título y autoría.
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ROJO).text(tipo.toUpperCase(), MARGEN, 262, { width: ANCHO_UTIL, characterSpacing: 3 });
    const tituloLimpio = String(tesis.titulo).replace(/\s+/g, ' ').trim();
    doc.font('Times-Bold').fontSize(tamanoDelTitulo(tituloLimpio)).fillColor('#0b1220');
    doc.text(tituloLimpio, MARGEN, 284, { width: ANCHO_UTIL, lineGap: 5 });
    const bajoDelTitulo = doc.y + 14;
    doc.rect(MARGEN, bajoDelTitulo, 56, 3).fill(ROJO);

    let y = bajoDelTitulo + 28;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GRIS).text('PRESENTADA POR', MARGEN, y, { characterSpacing: 1.8 });
    doc.font('Times-Bold').fontSize(18).fillColor(TINTA).text(tesis.autor, MARGEN, doc.y + 3, { width: ANCHO_UTIL });
    if (tesis.director) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GRIS).text('DIRECTOR(A) DE LA TESIS', MARGEN, doc.y + 14, { characterSpacing: 1.8 });
      doc.font('Times-Roman').fontSize(14).fillColor(TINTA).text(tesis.director, MARGEN, doc.y + 3, { width: ANCHO_UTIL });
    }

    // Datos principales en un recuadro al pie de la portada.
    const datos = [
      ['Año', tesis.anio],
      ['Código', tesis.id],
      ['Programa', tesis.programa],
      ['Signatura topográfica', tesis.signatura || 'Sin signatura'],
      ['Institución', tesis.institucion],
      ['Colección', tesis.coleccion],
    ];
    const recuadroY = ALTO - 292;
    doc.roundedRect(MARGEN, recuadroY, ANCHO_UTIL, 168, 10).fillAndStroke(FONDO, LINEA);
    const columna = (ANCHO_UTIL - 36) / 2;
    datos.forEach(([etiqueta, valor], i) => {
      const x = MARGEN + 18 + (i % 2) * (columna + 0);
      const yy = recuadroY + 18 + Math.floor(i / 2) * 50;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GRIS).text(etiqueta.toUpperCase(), x, yy, { width: columna - 12, characterSpacing: 1.2 });
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TINTA).text(recortar(valor, 70), x, yy + 12, { width: columna - 12, height: 28 });
    });

    // Nivel de acceso.
    const etiquetaDeAcceso = nivel.etiqueta.toUpperCase();
    doc.font('Helvetica-Bold').fontSize(9);
    const anchoDeLaEtiqueta = doc.widthOfString(etiquetaDeAcceso, { characterSpacing: 1.4 }) + 28;
    const insigniaY = recuadroY + 168 + 18;
    doc.roundedRect(MARGEN, insigniaY, anchoDeLaEtiqueta, 24, 12).fill(soloConsulta ? '#fef3c7' : '#dbeafe');
    doc.fillColor(soloConsulta ? '#92400e' : AZUL).text(etiquetaDeAcceso, MARGEN + 14, insigniaY + 8, { lineBreak: false, characterSpacing: 1.4 });
    doc.font('Helvetica').fontSize(9.5).fillColor(GRIS).text(nivel.resumen, MARGEN + anchoDeLaEtiqueta + 12, insigniaY + 7, {
      width: ANCHO_UTIL - anchoDeLaEtiqueta - 12,
      lineBreak: false,
      ellipsis: true,
    });

    // --- Ficha del documento ---------------------------------------------------------------------------------------

    doc.addPage();
    doc.outline.addItem('Ficha del documento');
    titulo('Ficha del documento');

    const filas = [
      ['Título', tesis.titulo],
      ['Autor', tesis.autor],
      ['Director(a)', tesis.director || '—'],
      ['Año', tesis.anio],
      ['Tipo de documento', tipo],
      ['Programa', tesis.programa],
      ['Institución', tesis.institucion],
      ['Facultad', tesis.facultad],
      ['Colección', tesis.coleccion],
      ['Páginas', tesis.paginas ? String(tesis.paginas) : '—'],
      ['Signatura topográfica', tesis.signatura || '—'],
      ['Código', tesis.id],
      ['Ejemplar impreso', `${tesis.ubicacion} · ${tesis.modalidadAcceso} (${tesis.consultaFisica})`],
      ['Temas', temas.length > 0 ? temas.join('; ') : '—'],
      ['Acceso al documento digital', `${nivel.etiqueta}. ${nivel.resumen}`],
    ];
    const anchoDeEtiqueta = 150;
    filas.forEach(([etiqueta, valor], i) => {
      doc.font('Helvetica').fontSize(10.5);
      const altura = Math.max(doc.heightOfString(String(valor), { width: ANCHO_UTIL - anchoDeEtiqueta - 24 }), 13) + 18;
      if (doc.y + altura > LIMITE_INFERIOR) doc.addPage();
      const filaY = doc.y;
      if (i % 2 === 0) doc.rect(MARGEN, filaY, ANCHO_UTIL, altura).fill('#f8fafc');
      doc.rect(MARGEN, filaY + altura - 0.5, ANCHO_UTIL, 0.5).fill(LINEA);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GRIS).text(etiqueta.toUpperCase(), MARGEN + 12, filaY + 10, {
        width: anchoDeEtiqueta - 14,
        characterSpacing: 1,
      });
      doc.font('Helvetica').fontSize(10.5).fillColor(TINTA).text(String(valor), MARGEN + anchoDeEtiqueta + 12, filaY + 9, {
        width: ANCHO_UTIL - anchoDeEtiqueta - 24,
      });
      doc.y = filaY + altura;
    });

    // --- Resumen ---------------------------------------------------------------------------------------------------

    doc.addPage();
    doc.outline.addItem('Resumen');
    titulo('Resumen');
    if (tesis.resumen) {
      doc.font('Times-Roman').fontSize(12.5).fillColor(TINTA).text(tesis.resumen, MARGEN, doc.y, { width: ANCHO_UTIL, align: 'justify', lineGap: 4 });
    } else {
      doc.font('Times-Italic').fontSize(12.5).fillColor(GRIS).text('Esta tesis no tiene un resumen registrado en el catálogo.', MARGEN, doc.y, { width: ANCHO_UTIL });
    }

    if (temas.length > 0) {
      doc.moveDown(2);
      doc.x = MARGEN;
      subtitulo('Palabras clave');
      doc.font('Helvetica-Bold').fontSize(9.5);
      let chipX = MARGEN;
      let chipY = doc.y + 2;
      temas.forEach((tema) => {
        const anchoDelChip = doc.widthOfString(tema) + 24;
        if (chipX + anchoDelChip > MARGEN + ANCHO_UTIL) {
          chipX = MARGEN;
          chipY += 30;
        }
        doc.roundedRect(chipX, chipY, anchoDelChip, 22, 11).fill('#eff6ff');
        doc.fillColor(AZUL).text(tema, chipX + 12, chipY + 6.5, { lineBreak: false });
        chipX += anchoDelChip + 8;
      });
      doc.y = chipY + 22;
    }

    // --- Cómo citar y condiciones de uso -------------------------------------------------------------------------

    doc.addPage();
    doc.outline.addItem('Cómo citar y condiciones de uso');
    titulo('Cómo citar y condiciones de uso');

    subtitulo('Cómo citar este documento');
    const citaY = doc.y;
    doc.font('Times-Roman').fontSize(12.5).fillColor(TINTA);
    doc.text(`${tesis.autor}. (${tesis.anio}). `, MARGEN + 16, citaY, { width: ANCHO_UTIL - 16, continued: true, lineGap: 3 });
    doc.font('Times-Italic').text(`${String(tesis.titulo).replace(/\s+/g, ' ').trim()} `, { continued: true });
    doc.font('Times-Roman').text(`[${tipo}, ${tesis.institucion}]. ${biblioteca.nombre}.`, { continued: false });
    doc.rect(MARGEN, citaY - 2, 4, doc.y - citaY + 4).fill(AZUL);
    doc.y += 24;
    doc.x = MARGEN;

    subtitulo('Condiciones de uso');
    const condiciones = [
      nivel.condicion,
      'Cita siempre la fuente y respeta los derechos de autor: este documento es solo para fines académicos y de investigación.',
      'No se permite su reproducción con fines comerciales ni su distribución en otros sitios sin autorización de la autoría y de la biblioteca.',
    ];
    condiciones.forEach((condicion) => {
      const punto = doc.y;
      doc.circle(MARGEN + 5, punto + 6, 2.2).fill(ROJO);
      doc.font('Helvetica').fontSize(10.5).fillColor(TINTA).text(condicion, MARGEN + 18, punto, { width: ANCHO_UTIL - 18, lineGap: 2 });
      doc.y += 7;
    });

    doc.y += 14;
    doc.x = MARGEN;
    const avisoY = doc.y;
    const textoDelAviso =
      'Este archivo es un documento de ejemplo que el sistema arma con los datos del catálogo mientras la biblioteca no cargue el archivo digitalizado de la tesis. ' +
      'Cuando exista, el personal de tesis escribe su URL en el panel (Catálogo, «URL de la tesis») y el documento y su código QR pasan a ese archivo.';
    doc.font('Helvetica').fontSize(9.5);
    const alturaDelAviso = doc.heightOfString(textoDelAviso, { width: ANCHO_UTIL - 36, lineGap: 2 }) + 44;
    doc.roundedRect(MARGEN, avisoY, ANCHO_UTIL, alturaDelAviso, 8).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.font('Helvetica-Bold').fontSize(9).fillColor(AZUL).text('SOBRE ESTE EJEMPLAR DIGITAL', MARGEN + 18, avisoY + 14, { characterSpacing: 1.4 });
    doc.font('Helvetica').fontSize(9.5).fillColor('#1e3a8a').text(textoDelAviso, MARGEN + 18, avisoY + 30, { width: ANCHO_UTIL - 36, lineGap: 2 });
    doc.y = avisoY + alturaDelAviso + 18;

    if (enlace) {
      doc.x = MARGEN;
      doc.font('Helvetica').fontSize(9.5).fillColor(GRIS).text('Ficha de esta tesis en el catálogo: ', MARGEN, doc.y, { continued: true });
      doc.fillColor('#1d4ed8').text(enlace, { link: enlace, underline: true });
    }

    // --- Encabezado y pie de cada página --------------------------------------------------------------------------

    const { start, count } = doc.bufferedPageRange();
    for (let i = start; i < start + count; i += 1) {
      doc.switchToPage(i);
      const margenInferior = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // sin esto, escribir debajo del margen abriría una página nueva

      if (i > 0) {
        doc.font('Helvetica').fontSize(8).fillColor(GRIS);
        doc.text(recortar(tesis.titulo, 78), MARGEN, 34, { width: ANCHO_UTIL - 110, lineBreak: false });
        doc.text(tesis.id, MARGEN, 34, { width: ANCHO_UTIL, align: 'right', lineBreak: false });
        doc.rect(MARGEN, 50, ANCHO_UTIL, 0.6).fill(LINEA);

        doc.rect(MARGEN, ALTO - 52, ANCHO_UTIL, 0.6).fill(LINEA);
        doc.font('Helvetica').fontSize(8).fillColor(GRIS);
        doc.text(biblioteca.nombre, MARGEN, ALTO - 42, { width: ANCHO_UTIL - 120, lineBreak: false });
        doc.text(`Página ${i + 1} de ${count}`, MARGEN, ALTO - 42, { width: ANCHO_UTIL, align: 'right', lineBreak: false });
      } else {
        doc.rect(MARGEN, ALTO - 52, ANCHO_UTIL, 0.6).fill(LINEA);
        doc.font('Helvetica').fontSize(8).fillColor(GRIS);
        doc.text(`${biblioteca.nombre} · ${tesis.coleccion}`, MARGEN, ALTO - 42, { width: ANCHO_UTIL, align: 'center', lineBreak: false });
      }
      doc.page.margins.bottom = margenInferior;
    }

    doc.end();
  });
}

module.exports = { pdfDeTesis };
