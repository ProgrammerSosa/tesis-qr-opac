// Proceso hijo de la prueba de PostgreSQL: guarda un documento con una espera larga y simula la señal de apagado (SIGTERM). Debe vaciar
// lo pendiente en la base de datos antes de salir. Uso: DATABASE_URL=... node hijo-apagado.cjs
const almacen = require('../../utils/almacen.js');

(async () => {
  await almacen.iniciar();
  const documento = almacen.cargar('prueba_apagado', { n: 0 });
  documento.n = 42;
  almacen.guardar('prueba_apagado', documento, 600000); // tardaría diez minutos si nadie lo vaciara
  console.log('PENDIENTE');
  process.emit('SIGTERM'); // el manejador guarda lo pendiente y sale con 0
})();
