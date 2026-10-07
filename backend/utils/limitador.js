const { fail } = require('./httpResponse');

// Limita cuántas peticiones puede hacer una misma dirección en un rato, para que un programa no llene la biblioteca de
// reservas o solicitudes falsas. Vive en memoria: sirve para una sola instalación del servidor.
// Detrás de un proxy (nginx, un servicio en la nube) hay que indicarlo con TRUST_PROXY para que `req.ip` sea la de la persona.
function limitar({ ventanaMs = 60 * 1000, maximo = 30, mensaje = 'Hiciste demasiadas peticiones seguidas. Espera un momento e inténtalo de nuevo.' } = {}) {
  const contadores = new Map(); // dirección -> { cantidad, hasta }

  return (req, res, next) => {
    const ahora = Date.now();
    if (contadores.size > 5000) {
      contadores.forEach((registro, clave) => {
        if (registro.hasta < ahora) contadores.delete(clave);
      });
    }

    let registro = contadores.get(req.ip);
    if (!registro || registro.hasta < ahora) {
      registro = { cantidad: 0, hasta: ahora + ventanaMs };
      contadores.set(req.ip, registro);
    }
    registro.cantidad += 1;

    if (registro.cantidad > maximo) {
      res.set('Retry-After', String(Math.ceil((registro.hasta - ahora) / 1000)));
      return fail(res, mensaje, 429);
    }
    return next();
  };
}

// Aplica un limitador solo a las peticiones que escriben datos (POST), dejando libres las lecturas.
function soloEscrituras(limitador) {
  return (req, res, next) => (req.method === 'POST' ? limitador(req, res, next) : next());
}

module.exports = { limitar, soloEscrituras };
