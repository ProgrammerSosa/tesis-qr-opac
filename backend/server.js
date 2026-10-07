const path = require('node:path');

// Los ajustes locales, como las claves del panel del personal, viven en backend/.env (no se sube a git; el modelo
// es backend/.env.example). Si el archivo no existe se usa el entorno tal cual, y lo que ya venga definido en el
// entorno tiene prioridad sobre el archivo. Debe cargarse antes que el resto del código, que lee esas variables.
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const express = require('express');
const cors = require('cors');

const catalogRoutes = require('./src/catalog/catalog_routes');
const reservasRoutes = require('./src/reservas/reservas_routes');
const solvenciaRoutes = require('./src/solvencia/solvencia_routes');
const adminRoutes = require('./src/admin/admin_routes');
const eventosRoutes = require('./src/eventos/eventos_routes');
const authRoutes = require('./src/auth/auth_routes');
const comprobantesRoutes = require('./src/comprobantes/comprobantes_routes');
const { retirarClavesTemporales } = require('./src/auth/auth_data');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ success: true, data: 'ok' }));

app.use('/api/tesis', catalogRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/solvencia', solvenciaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/comprobantes', comprobantesRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// Una cuenta sin clave definida recibe una clave temporal; se muestra aquí, en la consola, y en ningún otro lado.
function avisarClavesTemporales() {
  const temporales = retirarClavesTemporales();
  if (temporales.length === 0) return;
  console.warn('\n[panel del personal] Hay cuentas sin clave definida: usan una clave temporal, válida hasta que se reinicie el servidor.');
  temporales.forEach(({ usuario, variable, clave }) => {
    console.warn(`  ${usuario.padEnd(12)} ${clave}   (para fijarla: ${variable} en backend/.env)`);
  });
  console.warn('  Copia backend/.env.example como backend/.env y escribe tus claves para que no cambien.\n');
}

function start() {
  const port = process.env.PORT || 4001;
  app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
    avisarClavesTemporales();
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
