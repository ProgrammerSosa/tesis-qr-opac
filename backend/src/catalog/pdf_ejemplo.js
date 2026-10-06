// Genera un PDF mínimo de una página. Sirve como documento digital de ejemplo mientras no existan
// archivos digitalizados reales: el sistema ya sabe servirlos, consultarlos y descargarlos.

const REEMPLAZOS = { '–': '-', '—': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...', '·': '-' };

// El PDF usa la codificación WinAnsi (latin1): se cambian o quitan los caracteres que no caben.
function aLatin1(texto) {
  return String(texto)
    .replace(/[–—“”‘’…·]/g, (c) => REEMPLAZOS[c])
    .replace(/[^\x00-\xff]/g, '?');
}

function escaparPdf(texto) {
  return texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function partirEnLineas(texto, maximo) {
  const lineas = [];
  let actual = '';
  for (const palabra of texto.split(' ')) {
    if ((actual + ' ' + palabra).trim().length > maximo) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = (actual + ' ' + palabra).trim();
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function crearPdf(lineas) {
  const texto = lineas
    .map((linea, i) => `${i === 0 ? '' : 'T* '}(${escaparPdf(aLatin1(linea))}) Tj`)
    .join('\n');
  const flujo = `BT\n/F1 13 Tf\n18 TL\n60 780 Td\n${texto}\nET`;

  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(flujo, 'latin1')} >>\nstream\n${flujo}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];

  let pdf = '%PDF-1.4\n';
  const posiciones = [];
  objetos.forEach((objeto, i) => {
    posiciones.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const inicioXref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  pdf += posiciones.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function pdfDeTesis(tesis, acceso) {
  const nivel = acceso === 'acceso_descarga' ? 'Acceso y descarga' : 'Consulta digital';
  return crearPdf([
    'BIBLIOTECA FRANCISCO ROLANDO VELAZQUEZ GONZALEZ',
    `${tesis.facultad} - ${tesis.institucion}`,
    '',
    ...partirEnLineas(tesis.titulo, 64),
    '',
    `Autor: ${tesis.autor}`,
    `Director: ${tesis.director}`,
    `Anio: ${tesis.anio}    Paginas: ${tesis.paginas}`,
    `Codigo: ${tesis.id}    Signatura: ${tesis.signatura}`,
    `Nivel de acceso: ${nivel}`,
    '',
    ...partirEnLineas(
      'Documento de ejemplo generado por el sistema. Aqui se mostraria la tesis digitalizada, una vez revisada y almacenada en el repositorio institucional.',
      64
    ),
  ]);
}

module.exports = { pdfDeTesis };
