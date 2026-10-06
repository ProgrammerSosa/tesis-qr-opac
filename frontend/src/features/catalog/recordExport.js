import { enlaceDeTesis } from './ThesisQr';

// Campos MARC 21 derivados de la ficha. '#' en un indicador equivale a "sin definir".
export function marcFields(t) {
  return [
    { tag: '100', ind: '1#', sub: [['a', t.autor]] },
    { tag: '245', ind: '10', sub: [['a', t.titulo]] },
    { tag: '260', ind: '##', sub: [['b', t.facultad], ['c', t.anio]] },
    { tag: '300', ind: '##', sub: [['a', `${t.paginas} p.`]] },
    { tag: '502', ind: '##', sub: [['a', `${t.modalidad} — ${t.programa}`]] },
    { tag: '520', ind: '##', sub: [['a', t.resumen]] },
    ...t.temas.map((tema) => ({ tag: '650', ind: '#4', sub: [['a', tema]] })),
    { tag: '700', ind: '1#', sub: [['a', t.director], ['e', 'director']] },
    { tag: '852', ind: '##', sub: [['b', t.ubicacion], ['c', t.coleccion], ['h', t.signatura]] },
  ];
}

export function isbdText(t) {
  return [
    `${t.titulo} / ${t.autor}.`,
    `${t.facultad}, ${t.anio}.`,
    `${t.paginas} p.`,
    `(${t.modalidad} — ${t.programa}). Director(a): ${t.director}.`,
  ].join(' — ');
}

function escapeXml(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bibtex(t) {
  return `@mastersthesis{${t.id},
  author = {${t.autor}},
  title = {${t.titulo}},
  school = {${t.facultad}},
  year = {${t.anio}},
  type = {${t.modalidad}},
  note = {Director(a): ${t.director}},
  keywords = {${t.temas.join(', ')}},
  url = {${enlaceDeTesis(t.id)}}
}
`;
}

function ris(t) {
  return [
    'TY  - THES',
    `AU  - ${t.autor}`,
    `TI  - ${t.titulo}`,
    `PY  - ${t.anio}`,
    `PB  - ${t.facultad}`,
    `AB  - ${t.resumen}`,
    ...t.temas.map((tema) => `KW  - ${tema}`),
    `ID  - ${t.id}`,
    `UR  - ${enlaceDeTesis(t.id)}`,
    'ER  - ',
    '',
  ].join('\n');
}

function dublinCore(t) {
  const lineas = [
    ['dc:title', t.titulo],
    ['dc:creator', t.autor],
    ['dc:contributor', t.director],
    ['dc:publisher', t.facultad],
    ['dc:date', t.anio],
    ['dc:type', 'Tesis de grado'],
    ...t.temas.map((tema) => ['dc:subject', tema]),
    ['dc:description', t.resumen],
    ['dc:identifier', t.id],
    ['dc:language', 'es'],
  ];
  const cuerpo = lineas.map(([tag, valor]) => `  <${tag}>${escapeXml(valor)}</${tag}>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n${cuerpo}\n</metadata>\n`;
}

function marcXml(t) {
  const indicador = (c) => (c === '#' ? ' ' : c);
  const campos = marcFields(t)
    .map((f) => {
      const subs = f.sub.map(([code, valor]) => `    <subfield code="${code}">${escapeXml(valor)}</subfield>`).join('\n');
      return `  <datafield tag="${f.tag}" ind1="${indicador(f.ind[0])}" ind2="${indicador(f.ind[1])}">\n${subs}\n  </datafield>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<record xmlns="http://www.loc.gov/MARC21/slim">\n  <leader>00000nam a2200000 a 4500</leader>\n${campos}\n</record>\n`;
}

export const FORMATOS = [
  { key: 'bibtex', label: 'BIBTEX', ext: 'bib', mime: 'application/x-bibtex', build: bibtex },
  { key: 'dc', label: 'Dublin Core', ext: 'xml', mime: 'application/xml', build: dublinCore },
  { key: 'marcxml', label: 'MARCXML', ext: 'xml', mime: 'application/marcxml+xml', build: marcXml },
  { key: 'ris', label: 'RIS', ext: 'ris', mime: 'application/x-research-info-systems', build: ris },
  { key: 'isbd', label: 'ISBD', ext: 'txt', mime: 'text/plain', build: (t) => `${isbdText(t)}\n` },
];

export function descargarRegistro(tesis, formato) {
  const blob = new Blob([formato.build(tesis)], { type: `${formato.mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${tesis.id}-${formato.key}.${formato.ext}`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
