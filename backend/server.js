const express = require('express');
const cors = require('cors');

const catalogRoutes = require('./src/catalog/catalog_routes');
const reservasRoutes = require('./src/reservas/reservas_routes');
const solvenciaRoutes = require('./src/solvencia/solvencia_routes');
const adminRoutes = require('./src/admin/admin_routes');
const eventosRoutes = require('./src/eventos/eventos_routes');
const authRoutes = require('./src/auth/auth_routes');
const comprobantesRoutes = require('./src/comprobantes/comprobantes_routes');

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

function start() {
  const port = process.env.PORT || 4001;
  app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
