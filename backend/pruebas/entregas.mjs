// Prueba de la regla de entrega de solvencias con fechas concretas (2026-10-07 es miércoles).
import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'entregas-'));
process.env.TZ = 'America/Guatemala';
const require = createRequire(import.meta.url);
const solvencia = require('../src/solvencia/solvencia_data.js');
const horarios = require('../src/horarios/horarios_data.js');

let bien = 0;
let mal = 0;
function comprobar(descripcion, ahora, esperado) {
  const e = solvencia.entregaEstimada(ahora);
  const obtenido = `${e.fecha} ${e.hora}`;
  if (obtenido === esperado) {
    bien += 1;
    console.log(`  [OK] ${descripcion} -> ${obtenido}`);
  } else {
    mal += 1;
    console.log(`  [FALLA] ${descripcion}: esperaba ${esperado} y salió ${obtenido}`);
  }
}
const f = (anio, mes, dia, h, m = 0) => new Date(anio, mes - 1, dia, h, m, 0);

console.log('== Entrega estimada de solvencias');
comprobar('miércoles 10:00 (de 08:00 a 13:00)', f(2026, 10, 7, 10), '2026-10-07 15:00');
comprobar('miércoles 08:00 justo', f(2026, 10, 7, 8, 0), '2026-10-07 15:00');
comprobar('miércoles 13:00 justo', f(2026, 10, 7, 13, 0), '2026-10-07 15:00');
comprobar('miércoles 13:30 (de 13:01 a 17:00)', f(2026, 10, 7, 13, 30), '2026-10-07 18:00');
comprobar('miércoles 17:00 justo', f(2026, 10, 7, 17, 0), '2026-10-07 18:00');
comprobar('miércoles 18:30 (más tarde)', f(2026, 10, 7, 18, 30), '2026-10-08 14:00');
comprobar('miércoles 23:50', f(2026, 10, 7, 23, 50), '2026-10-08 14:00');
comprobar('miércoles 06:00 (antes de abrir)', f(2026, 10, 7, 6), '2026-10-07 14:00');
comprobar('viernes 19:00 pasa al lunes', f(2026, 10, 9, 19), '2026-10-12 14:00');
comprobar('sábado 10:00 pasa al lunes', f(2026, 10, 10, 10), '2026-10-12 14:00');
comprobar('domingo 10:00 pasa al lunes', f(2026, 10, 11, 10), '2026-10-12 14:00');

horarios.agregarCierre({ desde: '2026-10-08', hasta: '2026-10-08', motivo: 'Asueto de prueba' });
console.log('== Con un asueto el jueves 8');
comprobar('miércoles 19:00 salta el asueto', f(2026, 10, 7, 19), '2026-10-09 14:00');
comprobar('jueves (asueto) 10:00 pasa al viernes', f(2026, 10, 8, 10), '2026-10-09 14:00');
console.log(`día hábil: miércoles=${horarios.esDiaHabil('2026-10-07')}, jueves(asueto)=${horarios.esDiaHabil('2026-10-08')}, sábado=${horarios.esDiaHabil('2026-10-10')}`);
console.log(`\nResultado: ${bien} bien, ${mal} con fallas`);
process.exit(mal === 0 ? 0 : 1);
