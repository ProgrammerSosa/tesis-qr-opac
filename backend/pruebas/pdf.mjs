// Pruebas del documento digital de ejemplo (PDF) y de los niveles de acceso (servidor de pruebas en el puerto 4002).
const BASE = process.env.BASE || 'http://localhost:4002';
let fallos = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fallos += 1;
    console.log('  FALLA:', msg);
  } else console.log('  ok:', msg);
};

const pedir = (ruta, opciones = {}) => fetch(`${BASE}/api${ruta}`, { redirect: 'manual', ...opciones });
const paginas = (pdf) => (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length;

console.log('Acceso y descarga');
let r = await pedir('/tesis/T-2024-00123/documento');
let pdf = Buffer.from(await r.arrayBuffer());
ok(r.status === 200 && r.headers.get('content-type') === 'application/pdf', `se entrega un PDF (${r.status} ${r.headers.get('content-type')})`);
ok(pdf.slice(0, 5).toString() === '%PDF-' && pdf.slice(-8).toString('latin1').includes('%%EOF'), 'empieza y termina como un PDF');
ok(paginas(pdf) === 4, `tiene cuatro páginas: portada, ficha, resumen y cómo citar (${paginas(pdf)})`);
ok(pdf.length > 20000, `incluye el logo y pesa lo esperado (${pdf.length} bytes)`);
ok(/inline; filename="T-2024-00123.pdf"/.test(r.headers.get('content-disposition')), 'se muestra en línea con su nombre');
const sinMarca = pdf.length;

r = await pedir('/tesis/T-2024-00123/documento?descargar=1');
ok(r.status === 200 && /attachment; filename="T-2024-00123.pdf"/.test(r.headers.get('content-disposition')), 'con acceso y descarga se puede bajar');

console.log('Solo consulta');
r = await pedir('/tesis/T-2023-00098/documento');
pdf = Buffer.from(await r.arrayBuffer());
ok(r.status === 200 && paginas(pdf) === 4, 'se puede ver en línea');
ok(pdf.length !== sinMarca, 'lleva su propia versión (con la marca de agua «solo consulta»)');
r = await pedir('/tesis/T-2023-00098/documento?descargar=1');
ok(r.status === 403, `pero no se puede descargar (${r.status})`);

console.log('Sin acceso digital y tesis que no existe');
r = await pedir('/tesis/T-2022-00071/documento');
ok(r.status === 403, `sin acceso digital no hay documento (${r.status})`);
r = await pedir('/tesis/NO-EXISTE/documento');
ok(r.status === 404, `una tesis que no existe da 404 (${r.status})`);

console.log('Una tesis con datos largos y con caracteres especiales');
const entrada = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: 'tesis', clave: 'Tesis-prueba-1' }) });
const token = (await entrada.json()).data.token;
const crear = await fetch(`${BASE}/api/admin/catalogo`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    id: 'PDF-LARGO',
    titulo: 'Análisis crítico de “la reforma” al régimen de responsabilidad extracontractual del Estado en Guatemala: ¿hacia un modelo objetivo? — estudio comparado '.repeat(2),
    autor: 'Núñez Ibáñez, María José de los Ángeles',
    anio: '2024',
    director: 'Dr. Álvaro Peña Çelik',
    paginas: 312,
    temas: ['Responsabilidad extracontractual', 'Derecho administrativo', 'Estado de derecho', 'Derecho comparado', 'Garantías constitucionales', 'Reparación integral'],
    resumen: 'Este estudio examina, con enfoque comparado, los fundamentos de la responsabilidad del Estado. '.repeat(30),
    signatura: 'T.DER 2024.999',
    acceso: 'acceso_descarga',
  }),
});
ok(crear.status === 201, `se agrega la tesis larga (${crear.status})`);
r = await pedir('/tesis/PDF-LARGO/documento');
pdf = Buffer.from(await r.arrayBuffer());
ok(r.status === 200 && pdf.slice(0, 5).toString() === '%PDF-', 'el PDF de una tesis con título y resumen largos se genera');
ok(paginas(pdf) >= 4, `el resumen largo pasa a más páginas si hace falta (${paginas(pdf)})`);

console.log('Con una URL de la tesis, el documento es esa URL');
await fetch(`${BASE}/api/admin/tesis/T-2024-00123/documento`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ urlExterna: 'https://repositorio.ejemplo.edu.gt/tesis/T-2024-00123.pdf' }),
});
r = await pedir('/tesis/T-2024-00123/documento');
ok(r.status === 302 && r.headers.get('location') === 'https://repositorio.ejemplo.edu.gt/tesis/T-2024-00123.pdf', `redirige a la URL de la tesis (${r.status} ${r.headers.get('location')})`);

console.log(fallos === 0 ? '\nTODO BIEN' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
