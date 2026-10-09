// Pruebas de la URL de la tesis y del destino del QR (servidor de pruebas en el puerto 4002).
const BASE = process.env.BASE || 'http://localhost:4002';
let fallos = 0;
const ok = (cond, msg) => {
  if (!cond) {
    fallos += 1;
    console.log('  FALLA:', msg);
  } else console.log('  ok:', msg);
};

async function api(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const r = await fetch(`${BASE}/api${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let json = null;
  try {
    json = await r.json();
  } catch {
    /* sin cuerpo */
  }
  return { estado: r.status, json, datos: json?.data };
}

const entrar = async (usuario, clave) => (await api('/auth/login', { metodo: 'POST', cuerpo: { usuario, clave } })).datos?.token;

const token = await entrar('tesis', 'Tesis-prueba-1');
ok(Boolean(token), 'entra el personal de tesis');
const base = { titulo: 'Tesis de prueba con URL', autor: 'Pérez Gómez, Ana', anio: '2024' };

console.log('Alta con URL');
let r = await api('/admin/catalogo', { metodo: 'POST', token, cuerpo: { ...base, id: 'U-001', urlTesis: ' https://repositorio.ejemplo.edu.gt/tesis/U-001.pdf ' } });
ok(r.estado === 201, `crea la tesis (${r.estado})`);
ok(r.datos?.documentoDigital?.urlExterna === 'https://repositorio.ejemplo.edu.gt/tesis/U-001.pdf', 'guarda la URL sin espacios');
ok(r.datos?.documentoDigital?.acceso === 'consulta', 'con URL y sin acceso indicado queda en consulta');
ok(r.datos?.qr?.destino === 'enlace', 'el QR usa el enlace corto por defecto');
ok(r.datos?.documentoDigital?.disponible === true, 'el documento queda disponible');

console.log('Alta con URL y acceso explícito');
r = await api('/admin/catalogo', { metodo: 'POST', token, cuerpo: { ...base, id: 'U-002', urlTesis: 'https://example.com/a?b=1&c=ñ', acceso: 'acceso_descarga', destinoQr: 'ficha' } });
ok(r.estado === 201 && r.datos.documentoDigital.acceso === 'acceso_descarga' && r.datos.qr.destino === 'ficha', 'respeta acceso y destino indicados');
ok(r.datos?.documentoDigital?.urlExterna === 'https://example.com/a?b=1&c=%C3%B1', 'normaliza los caracteres no ASCII de la URL');

console.log('Alta sin URL');
r = await api('/admin/catalogo', { metodo: 'POST', token, cuerpo: { ...base, id: 'U-003' } });
ok(r.estado === 201 && r.datos.documentoDigital.acceso === 'sin_acceso' && r.datos.documentoDigital.urlExterna === null, 'sin URL queda sin acceso y sin enlace');

console.log('URL inválidas');
for (const mala of ['ftp://x.com/a', 'javascript:alert(1)', 'www.ejemplo.com/tesis', 'https://con espacio.com', 'https://', 'http://' + 'a'.repeat(2100) + '.com']) {
  r = await api('/admin/catalogo', { metodo: 'POST', token, cuerpo: { ...base, id: 'U-MALA', urlTesis: mala } });
  ok(r.estado === 400, `rechaza «${mala.slice(0, 30)}» (${r.estado})`);
}
r = await api('/admin/catalogo', { metodo: 'POST', token, cuerpo: { ...base, id: 'U-MALA', urlTesis: 'https://ok.com/x', acceso: 'total' } });
ok(r.estado === 400, 'rechaza un nivel de acceso inválido');
r = await api('/admin/catalogo', { metodo: 'POST', token, cuerpo: { ...base, id: 'U-MALA', destinoQr: 'otro' } });
ok(r.estado === 400, 'rechaza un destino de QR inválido');
r = await api('/admin/tesis?porPagina=100', { token });
ok(!r.datos.items.some((t) => t.id === 'U-MALA'), 'ninguna de las rechazadas se guardó');

console.log('Edición');
r = await api('/admin/catalogo/U-003', { metodo: 'PATCH', token, cuerpo: { ...base, urlTesis: 'https://repositorio.ejemplo.edu.gt/tesis/U-003.pdf', acceso: 'consulta' } });
ok(r.estado === 200 && r.datos.documentoDigital.urlExterna?.endsWith('U-003.pdf') && r.datos.documentoDigital.acceso === 'consulta', 'agrega la URL y el acceso al editar');
r = await api('/admin/catalogo/U-003', { metodo: 'PATCH', token, cuerpo: { titulo: 'Título nuevo para la prueba' } });
ok(r.estado === 200 && r.datos.documentoDigital.urlExterna?.endsWith('U-003.pdf'), 'editar solo el título no borra la URL');
r = await api('/admin/catalogo/U-003', { metodo: 'PATCH', token, cuerpo: { urlTesis: '' } });
ok(r.estado === 200 && r.datos.documentoDigital.urlExterna === null, 'una URL vacía la quita');

console.log('Destino del QR');
r = await api('/admin/qr/U-001', { metodo: 'PATCH', token, cuerpo: { destino: 'ficha' } });
ok(r.estado === 200 && r.datos.qr.destino === 'ficha' && r.datos.qr.activo === true, 'cambia el destino sin tocar el estado');
r = await api('/admin/qr/U-001', { metodo: 'PATCH', token, cuerpo: { destino: 'afuera' } });
ok(r.estado === 400, 'destino inválido → 400');
r = await api('/admin/qr/U-001', { metodo: 'PATCH', token, cuerpo: {} });
ok(r.estado === 400, 'sin nada que cambiar → 400');
r = await api('/admin/qr/U-001', { metodo: 'PATCH', token, cuerpo: { activo: false } });
ok(r.estado === 200 && r.datos.qr.activo === false && r.datos.qr.destino === 'ficha', 'desactivar conserva el destino');
await api('/admin/qr/U-001', { metodo: 'PATCH', token, cuerpo: { activo: true } });

console.log('Documento (sección Tesis digitales)');
r = await api('/admin/tesis/U-001/documento', { metodo: 'PATCH', token, cuerpo: { urlExterna: 'no es una url' } });
ok(r.estado === 400, 'el enlace inválido se rechaza también aquí');
r = await api('/admin/tesis/U-001/documento', { metodo: 'PATCH', token, cuerpo: { urlExterna: `${BASE}/health` } });
ok(r.estado === 200 && r.datos.documentoDigital.urlExterna === `${BASE}/health`, 'enlace válido guardado');

console.log('Verificación');
r = await api('/admin/qr/U-001/verificar', { metodo: 'POST', token });
ok(r.datos?.qr?.resultado === 'ok', `un enlace que responde se marca correcto (${r.datos?.qr?.resultado})`);
r = await api('/admin/tesis/U-001/documento', { metodo: 'PATCH', token, cuerpo: { urlExterna: 'http://localhost:9/no-existe' } });
ok(r.datos?.qr?.verificadoEn === null, 'cambiar el enlace deja el QR «sin verificar»');
r = await api('/admin/qr/U-001/verificar', { metodo: 'POST', token });
ok(r.datos?.qr?.resultado === 'enlace_roto', `un enlace que no responde se marca roto (${r.datos?.qr?.resultado})`);

console.log('Importación con URL');
r = await api('/admin/catalogo/importar', {
  metodo: 'POST',
  token,
  cuerpo: {
    existentes: 'actualizar',
    filas: [
      { id: 'I-001', titulo: 'Importada con URL', autor: 'Gómez, Luis', anio: '2023', urlTesis: 'https://repositorio.ejemplo.edu.gt/I-001.pdf', acceso: 'acceso_descarga' },
      { id: 'I-002', titulo: 'Importada sin URL', autor: 'Gómez, Luis', anio: '2023' },
      { id: 'I-003', titulo: 'Importada con URL mala', autor: 'Gómez, Luis', anio: '2023', urlTesis: 'esto no es url' },
      { id: 'U-002', titulo: 'Tesis que ya existía', autor: 'Pérez Gómez, Ana', anio: '2024', urlTesis: 'https://example.com/nueva' },
    ],
  },
});
ok(r.estado === 200 && r.datos.creadas === 2 && r.datos.actualizadas === 1 && r.datos.totalErrores === 1, `importa 2, actualiza 1 y rechaza 1 (${JSON.stringify(r.datos)})`);
ok(/URL de la tesis/.test(r.datos?.errores?.[0]?.motivo ?? ''), 'el error de la fila habla de la URL');
r = await api('/admin/tesis?q=I-001', { token });
ok(r.datos.items[0]?.documentoDigital.acceso === 'acceso_descarga' && r.datos.items[0].documentoDigital.urlExterna.endsWith('I-001.pdf'), 'la fila importada trae su URL y su acceso');
r = await api('/admin/tesis?q=U-002', { token });
ok(r.datos.items[0]?.documentoDigital.urlExterna === 'https://example.com/nueva' && r.datos.items[0].documentoDigital.acceso === 'acceso_descarga', 'actualizar cambia la URL y conserva el acceso que no vino');

console.log('Vista pública');
r = await api('/tesis/U-001');
ok(r.estado === 200 && r.datos.documentoDigital.urlExterna === undefined && !JSON.stringify(r.datos).includes('localhost:9'), 'la ficha pública no muestra la URL');
ok(r.datos?.qr?.destino === 'ficha' && r.datos.qr.enlace === null, 'dice que el código lleva a la ficha, sin enlace');

console.log('Enlace corto del QR (/r/<código>)');
const corto = (id) => fetch(`${BASE}/r/${id}`, { redirect: 'manual' });
const consulta = await entrar('consulta', 'Consulta-prueba-1');
const escaneos = async (id) => (await api('/admin/estadisticas', { token: consulta })).datos.tesisMasConsultadas.find((t) => t.id === id)?.accesosQr ?? 0;
const URL_1 = 'https://repositorio.ejemplo.edu.gt/tesis/E-001.pdf';
const URL_2 = 'https://otro-servidor.ejemplo.edu.gt/nuevo/E-001.pdf';
r = await api('/admin/catalogo', { metodo: 'POST', token, cuerpo: { ...base, id: 'E-001', urlTesis: URL_1 } });
ok(r.estado === 201 && r.datos.qr.destino === 'enlace', 'tesis nueva con URL: su código usa el enlace corto');
let salto = await corto('E-001');
ok(salto.status === 302 && salto.headers.get('location') === URL_1, `el enlace corto abre la URL de la tesis (${salto.status} ${salto.headers.get('location')})`);
ok(salto.headers.get('cache-control') === 'no-store', 'no se guarda en memoria intermedia: cada escaneo llega al servidor');
ok((await escaneos('E-001')) === 1, 'el escaneo se cuenta');
await corto('E-001');
ok((await escaneos('E-001')) === 2, 'y el siguiente también');
r = await api('/tesis/E-001');
ok(r.datos.qr.destino === 'enlace' && r.datos.qr.enlace === null && !JSON.stringify(r.datos).includes('repositorio.ejemplo'), 'la ficha pública dice «enlace» sin mostrar la URL');

await api('/admin/catalogo/E-001', { metodo: 'PATCH', token, cuerpo: { urlTesis: URL_2 } });
salto = await corto('E-001');
ok(salto.headers.get('location') === URL_2, 'al cambiar la URL, el mismo enlace corto abre la nueva (no hay que reimprimir)');

r = await api('/admin/qr/E-001', { metodo: 'PATCH', token, cuerpo: { destino: 'url' } });
ok(r.estado === 200 && r.datos.qr.destino === 'url', 'se puede elegir la URL tal cual');
r = await api('/tesis/E-001');
ok(r.datos.qr.destino === 'url' && r.datos.qr.enlace === URL_2, 'con la URL tal cual, la ficha pública trae la URL que lleva el código');
salto = await corto('E-001');
ok(salto.headers.get('location') === URL_2, 'el enlace corto sigue abriendo la URL aunque el código lleve la URL tal cual');

await api('/admin/qr/E-001', { metodo: 'PATCH', token, cuerpo: { destino: 'ficha' } });
const antes = await escaneos('E-001');
salto = await corto('E-001');
ok(salto.status === 302 && salto.headers.get('location') === '/tesis/E-001?origen=qr', `con destino «ficha» lleva a la ficha (${salto.headers.get('location')})`);
ok((await escaneos('E-001')) === antes, 'ese escaneo lo cuenta la ficha, no el enlace corto');

await api('/admin/qr/E-001', { metodo: 'PATCH', token, cuerpo: { destino: 'enlace', activo: false } });
salto = await corto('E-001');
ok(salto.headers.get('location') === '/tesis/E-001?origen=qr', 'un código desactivado lleva a la ficha (que lo explica)');
r = await api('/tesis/E-001');
ok(r.datos.qr.activo === false && r.datos.qr.destino === 'ficha', 'y la ficha pública lo sabe');
await api('/admin/qr/E-001', { metodo: 'PATCH', token, cuerpo: { activo: true } });

await api('/admin/tesis/E-001/documento', { metodo: 'PATCH', token, cuerpo: { acceso: 'sin_acceso' } });
salto = await corto('E-001');
ok(salto.headers.get('location') === '/tesis/E-001?origen=qr', 'sin acceso digital lleva a la ficha y no revela la URL');
salto = await corto('U-003');
ok(salto.headers.get('location') === '/tesis/U-003?origen=qr', 'una tesis sin URL lleva a su ficha');
salto = await corto('NO-EXISTE');
ok(salto.status === 302 && salto.headers.get('location') === '/tesis/NO-EXISTE?origen=qr', 'un código que no existe lleva a la ficha, que dice que no se encontró');
salto = await corto('a%2F..%2Fb');
ok(salto.status === 302 && salto.headers.get('location') === '/tesis/a%2F..%2Fb?origen=qr', `un código raro no puede sacar la redirección del sitio (${salto.headers.get('location')})`);

console.log('Horario semanal público');
r = await api('/horarios/semana');
ok(r.estado === 200 && r.datos.semana.length === 7 && r.datos.semana[0].clave === 'lunes' && r.datos.semana[6].clave === 'domingo', 'semana de lunes a domingo');
ok(r.datos.semana.filter((d) => d.esHoy).length === 1, 'marca un solo día como hoy');
ok(Array.isArray(r.datos.proximosCierres) && typeof r.datos.hoy?.cerrado === 'boolean', 'trae los próximos cierres y el estado de hoy');

console.log(fallos === 0 ? '\nTODO BIEN' : `\n${fallos} FALLAS`);
process.exit(fallos === 0 ? 0 : 1);
