// Datos importantes de las tesis: el administrador marca qué datos (además de código, título, autor y año) son importantes. Una tesis
// que no los trae se registra igual, porque a veces la entregan así, pero queda marcada como incompleta para completarla después.
import fs from 'node:fs';
import { arrancarServidor, carpetaTemporal, cliente, comprobador, pausa } from './servidor.mjs';

const { ok, terminar } = comprobador();
const datos = carpetaTemporal('campos');
const base = { titulo: 'Tesis de prueba de los datos importantes', autor: 'Pérez, Ana', anio: '2024' };
const campos = (lista) => (lista ?? []).map((f) => f.campo).join();

try {
  const servidor = await arrancarServidor({ datos });
  const { api, entrar } = cliente(servidor.base);
  try {
    const admin = await entrar('admin');
    const tesis = await entrar('tesis');

    console.log('Lo que viene marcado de entrada');
    const conf = (await api('GET', '/admin/configuracion', { token: admin })).datos;
    ok(campos(conf.camposDeTesis) === 'director,paginas,temas,resumen,signatura', `se pueden marcar director, páginas, temas, resumen y signatura (${campos(conf.camposDeTesis)})`);
    ok(conf.camposImportantes.join() === 'director,paginas,temas,resumen', `de entrada son importantes director, páginas, temas y resumen (${conf.camposImportantes.join()})`);

    console.log('Una tesis a la que le faltan datos se registra igual, marcada como incompleta');
    const incompleta = await api('POST', '/admin/catalogo', { token: tesis, cuerpo: { ...base, id: 'F-001', temas: 'Derecho civil' } });
    ok(incompleta.estado === 201, `se guarda aunque falten datos importantes (${incompleta.estado} ${incompleta.error ?? ''})`);
    ok(campos(incompleta.datos?.faltan) === 'director,paginas,resumen', `y dice cuáles faltan (${campos(incompleta.datos?.faltan)})`);
    ok(incompleta.datos?.faltan?.[0]?.nombre === 'Director(a)', 'con su nombre para mostrarlo');
    const completa = await api('POST', '/admin/catalogo', {
      token: tesis,
      cuerpo: { ...base, id: 'F-002', director: 'Lic. Gómez', paginas: 120, temas: 'Penal; Procesal', resumen: 'Resumen de la tesis de prueba.' },
    });
    ok(completa.estado === 201 && completa.datos.faltan.length === 0, 'una con todos los datos importantes queda completa');
    ok((await api('POST', '/admin/catalogo', { token: tesis, cuerpo: { ...base, id: 'F-003', titulo: '' } })).estado === 400, 'el título sigue siendo obligatorio');

    console.log('El catálogo del panel las muestra y las filtra');
    const lista = async (filtro = '') => (await api('GET', `/admin/catalogo?porPagina=100${filtro}`, { token: tesis })).datos;
    const todas = await lista();
    ok(campos(todas.camposImportantes) === 'director,paginas,temas,resumen', 'la lista dice qué datos son importantes (para el formulario)');
    ok(todas.items.every((t) => Array.isArray(t.faltan)), 'cada tesis trae lo que le falta');
    const incompletas = (await lista('&completitud=incompletas')).items.map((t) => t.id);
    ok(incompletas.includes('F-001') && !incompletas.includes('F-002'), `el filtro de incompletas trae la incompleta y no la completa (${incompletas.join()})`);
    const completas = (await lista('&completitud=completas')).items.map((t) => t.id);
    ok(completas.includes('F-002') && !completas.includes('F-001'), 'y el de completas al revés');
    ok(incompletas.length + completas.length === todas.total, 'entre las dos están todas');

    console.log('Completar la tesis la saca de las incompletas');
    const corregida = await api('PATCH', '/admin/catalogo/F-001', { token: tesis, cuerpo: { director: 'Licda. Ruiz', paginas: 80, resumen: 'Ahora tiene resumen.' } });
    ok(corregida.estado === 200 && corregida.datos.faltan.length === 0, `al agregar lo que faltaba queda completa (${campos(corregida.datos?.faltan)})`);

    console.log('El resumen del panel cuenta las incompletas');
    const antes = (await api('GET', '/admin/resumen', { token: tesis })).datos.tesis.incompletas;
    ok(Number.isInteger(antes) && antes === (await lista('&completitud=incompletas')).total, `el resumen dice cuántas hay (${antes})`);

    console.log('El administrador decide qué es importante');
    ok((await api('PATCH', '/admin/configuracion', { token: tesis, cuerpo: { camposImportantes: ['director'] } })).estado === 403, 'el personal de tesis no puede cambiarlo');
    const malo = await api('PATCH', '/admin/configuracion', { token: admin, cuerpo: { camposImportantes: ['director', 'color'] } });
    ok(malo.estado === 400, `un dato que no existe se rechaza (${malo.estado})`);
    ok((await api('PATCH', '/admin/configuracion', { token: admin, cuerpo: { camposImportantes: 'director' } })).estado === 400, 'tiene que ser una lista');
    const cambio = await api('PATCH', '/admin/configuracion', { token: admin, cuerpo: { camposImportantes: ['signatura'] } });
    ok(cambio.estado === 200 && cambio.datos.camposImportantes.join() === 'signatura', 'se cambia a solo la signatura');
    const ahora = await lista();
    ok(campos(ahora.camposImportantes) === 'signatura' && ahora.items.find((t) => t.id === 'F-002').faltan.map((f) => f.campo).join() === 'signatura', 'y desde ya cuenta lo nuevo');
    const actividad = (await api('GET', '/admin/actividad?limite=20', { token: admin })).datos.registros.find((r) => r.accion === 'configuracion.cambiada');
    ok(/datos importantes/.test(actividad?.detalle ?? ''), `queda anotado en la actividad (${actividad?.detalle})`);
    const ninguno = await api('PATCH', '/admin/configuracion', { token: admin, cuerpo: { camposImportantes: [] } });
    ok(ninguno.estado === 200 && (await lista('&completitud=incompletas')).total === 0, 'sin ningún dato importante no hay incompletas');

    console.log('La importación avisa cuántas llegaron incompletas');
    await api('PATCH', '/admin/configuracion', { token: admin, cuerpo: { camposImportantes: ['director', 'resumen'] } });
    const importacion = await api('POST', '/admin/catalogo/importar', {
      token: tesis,
      cuerpo: {
        filas: [
          { id: 'I-001', titulo: 'Importada con todo lo importante', autor: 'Uno, Autor', anio: '2020', director: 'Lic. Uno', resumen: 'Con resumen.' },
          { id: 'I-002', titulo: 'Importada sin director', autor: 'Dos, Autor', anio: '2021', resumen: 'Con resumen.' },
          { id: 'I-003', titulo: 'Importada sin director ni resumen', autor: 'Tres, Autor', anio: '2022' },
        ],
      },
    });
    ok(importacion.estado === 200 && importacion.datos.creadas === 3 && importacion.datos.incompletas === 2, `se importan las tres y avisa que 2 quedaron incompletas (${JSON.stringify(importacion.datos)})`);

    console.log('Lo público no cambia');
    const publica = (await api('GET', '/tesis/I-003')).datos;
    ok(publica.faltan === undefined, 'la ficha pública no dice qué le falta a la tesis');
    await pausa(700);
  } finally {
    await servidor.parar();
  }

  console.log('La elección se conserva al reiniciar');
  const otra = await arrancarServidor({ datos });
  try {
    const { api, entrar } = cliente(otra.base);
    const conf = (await api('GET', '/admin/configuracion', { token: await entrar('admin') })).datos;
    ok(conf.camposImportantes.join() === 'director,resumen', `sigue director y resumen (${conf.camposImportantes.join()})`);
  } finally {
    await otra.parar();
  }
} finally {
  fs.rmSync(datos, { recursive: true, force: true });
}
terminar();
