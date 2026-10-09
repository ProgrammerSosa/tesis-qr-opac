// La búsqueda del catálogo tiene que encontrar lo que la gente escribe de verdad: sin tildes, en mayúsculas, con las palabras en otro
// orden o salteadas, y el autor con el apellido primero. Usa las siete tesis de ejemplo.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { carpetaTemporal, comprobador } from './servidor.mjs';

const datos = carpetaTemporal('busqueda');
process.env.DATA_DIR = datos;
process.env.DATABASE_URL = '';
const require = createRequire(import.meta.url);
const { buscarTesis, listarParaAdmin, crearTesis } = require('../src/catalog/catalog_data.js');

const { ok, terminar } = comprobador();
const ids = (criterios) => buscarTesis(criterios).map((t) => t.id).sort().join();
const es = (criterios, esperado, descripcion) => ok(ids(criterios) === esperado, `${descripcion} → «${ids(criterios)}» (esperado «${esperado}»)`);

const CONCILIACION = 'T-2023-00098,T-2023-00114,T-2024-00123'; // las tres tesis con «conciliación» en el título

console.log('Título');
es({ titulo: 'conciliación' }, CONCILIACION, 'con tilde');
es({ titulo: 'conciliacion' }, CONCILIACION, 'sin tilde');
es({ titulo: 'CONCILIACIÓN' }, CONCILIACION, 'en mayúsculas');
es({ titulo: '  Conciliacion  ' }, CONCILIACION, 'con espacios de más');
es({ titulo: 'concilia' }, CONCILIACION, 'solo el comienzo de la palabra');
es({ titulo: 'conciliación en los procesos de familia' }, 'T-2024-00123', 'el ejemplo que muestra el propio formulario');
es({ titulo: 'familia conciliacion' }, 'T-2023-00098,T-2024-00123', 'dos palabras salteadas y en otro orden');
es({ titulo: 'mediación, familiar' }, 'T-2023-00098', 'con una coma en medio');
es({ titulo: 'balance 2015-2023' }, 'T-2023-00114', 'con números y guion');
es({ titulo: 'conciliación astronomía' }, '', 'si una palabra no está, no hay resultados');
es({ titulo: 'xyz' }, '', 'lo que no existe no se encuentra');

console.log('Autor');
es({ autor: 'Mariana Fonseca' }, 'T-2024-00123', 'nombre y apellido');
es({ autor: 'Fonseca, Mariana' }, 'T-2024-00123', 'apellido primero con coma (como pide el formulario)');
es({ autor: 'fonseca rios' }, 'T-2024-00123', 'apellidos sin tilde');
es({ autor: 'PEÑA' }, 'T-2022-00071', 'con ñ');
es({ autor: 'pena' }, 'T-2022-00071', 'la ñ escrita como n');
es({ autor: 'Fonseca Tzoc' }, '', 'dos apellidos de personas distintas no encuentran nada');

console.log('Tema');
es({ tema: 'mediacion' }, 'T-2022-00088,T-2023-00098', 'sin tilde');
es({ tema: 'derecho civil' }, 'T-2021-00045,T-2022-00071,T-2023-00098,T-2024-00123', 'dos palabras (también «Derecho procesal civil»)');
es({ tema: 'conciliacion familia' }, 'T-2024-00123', 'palabras de dos temas distintos de la misma tesis');
es({ tema: 'clinica juridica' }, 'T-2023-00114', 'dos palabras sin tilde');

console.log('Criterios juntos');
es({ titulo: 'conciliacion', anio: '2023' }, 'T-2023-00098,T-2023-00114', 'título y año');
es({ titulo: 'mediacion', tema: 'penal' }, 'T-2022-00088', 'título y tema');
es({ autor: 'fonseca', titulo: 'juicio oral' }, '', 'criterios que no coinciden en la misma tesis');
ok(buscarTesis({}).length === 7, 'sin criterios salen todas');
ok(buscarTesis({ titulo: '   ' }).length === 7 && buscarTesis({ titulo: ',.-' }).length === 7, 'un criterio vacío o de solo signos no filtra');

console.log('Buscador del panel');
const delPanel = (q) => listarParaAdmin({ q, porPagina: 50 }).items.map((t) => t.id).sort().join();
ok(delPanel('conciliacion familia') === 'T-2023-00098,T-2024-00123', `palabras salteadas y sin tilde (${delPanel('conciliacion familia')})`);
ok(delPanel('fonseca 2024.123') === 'T-2024-00123', `autor y signatura a la vez (${delPanel('fonseca 2024.123')})`);
ok(delPanel('T-2021-00045') === 'T-2021-00045', 'el código completo');
ok(delPanel('t-2021') === 'T-2021-00045', 'parte del código en minúsculas');
crearTesis({ id: 'I-001', titulo: 'Importada con URL', autor: 'Gómez, Luis', anio: '2023' });
crearTesis({ id: 'U-001', titulo: 'Tesis de prueba con URL', autor: 'Pérez Gómez, Ana', anio: '2024' });
ok(delPanel('I-001') === 'I-001', `un código con guion encuentra solo su tesis, no las que tengan sus pedazos (${delPanel('I-001')})`);
ok(delPanel('u-001 gomez') === 'U-001', `código y apellido a la vez (${delPanel('u-001 gomez')})`);
ok(delPanel('gomez') === 'I-001,U-001', `una palabra común encuentra las dos (${delPanel('gomez')})`);

console.log('Una tesis cambiada se encuentra por su texto nuevo');
crearTesis({ id: 'B-001', titulo: 'Régimen jurídico de la niñez migrante', autor: 'Núñez Ordóñez, Íñigo', anio: '2022', temas: 'Niñez; Migración' });
es({ titulo: 'regimen juridico ninez' }, 'B-001', 'una tesis recién agregada');
es({ autor: 'inigo nunez ordonez' }, 'B-001', 'su autor, sin tildes ni eñes');
es({ tema: 'migracion' }, 'B-001', 'y su tema');

fs.rmSync(datos, { recursive: true, force: true });
terminar();
