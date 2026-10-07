// Error con el código HTTP que debe devolver el controlador (los controladores lo leen en `err.estado`).
function rechazo(mensaje, estado = 400) {
  const error = new Error(mensaje);
  error.estado = estado;
  return error;
}

module.exports = { rechazo };
