// La visita que el servidor se hace a sí mismo para que Render no lo duerma: qué dirección usa, cada cuánto y cuándo no hace nada.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { direccionAVisitar, minutosEntreVisitas, mantenerDespierto } = require('../utils/mantenerDespierto.js');

let fallos = 0;
let comprobaciones = 0;
const ok = (cond, msg) => {
  comprobaciones += 1;
  if (!cond) {
    fallos += 1;
    console.log('  FALLA:', msg);
  }
};

ok(direccionAVisitar({}) === null, 'sin dirección pública no visita nada');
ok(direccionAVisitar({ RENDER_EXTERNAL_URL: 'https://x.onrender.com/' }) === 'https://x.onrender.com/health', 'usa la dirección que pone Render');
ok(direccionAVisitar({ RENDER_EXTERNAL_URL: 'https://x.onrender.com', KEEPALIVE_URL: 'https://otra.example' }) === 'https://otra.example/health', 'KEEPALIVE_URL manda');
ok(direccionAVisitar({ RENDER_EXTERNAL_URL: 'https://x.onrender.com', KEEPALIVE: '0' }) === null, 'KEEPALIVE=0 lo apaga');
ok(direccionAVisitar({ KEEPALIVE_URL: 'x.onrender.com' }) === null, 'una dirección sin http no se usa');
ok(minutosEntreVisitas({}) === 10, 'cada 10 minutos por defecto');
ok(minutosEntreVisitas({ KEEPALIVE_MINUTOS: '5' }) === 5, 'se puede cambiar el intervalo');
ok(minutosEntreVisitas({ KEEPALIVE_MINUTOS: '20' }) === 10 && minutosEntreVisitas({ KEEPALIVE_MINUTOS: 'x' }) === 10, 'un intervalo de 15 o más (o mal escrito) se ignora');

const mudo = { log() {}, warn() {} };
ok(mantenerDespierto({ env: {}, registro: mudo }) === null, 'sin dirección no arranca el reloj');
const reloj = mantenerDespierto({ env: { RENDER_EXTERNAL_URL: 'https://x.onrender.com' }, visitar: async () => ({ ok: true }), registro: mudo });
ok(reloj !== null, 'con dirección arranca el reloj');
clearInterval(reloj);

console.log(`${comprobaciones} comprobaciones: ${fallos === 0 ? 'TODO BIEN' : `${fallos} FALLAS`}`);
process.exit(fallos === 0 ? 0 : 1);
