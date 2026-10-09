const { fail } = require('./httpResponse');

// Límites de uso por dirección. Viven en memoria: sirven para una sola instalación del servidor.
// Detrás de un proxy (nginx, un servicio en la nube) hay que indicarlo con TRUST_PROXY para que `req.ip` sea la de la persona.

// Cuenta las peticiones de cada dirección dentro de una ventana de tiempo. Devuelve una función que anota una petición más y dice
// cuántas lleva esa dirección y cuándo se reinicia su cuenta.
function contador({ ventanaMs = 60 * 1000 } = {}) {
  const contadores = new Map(); // dirección -> { cantidad, hasta }

  return (req) => {
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
    return { cantidad: registro.cantidad, faltanMs: registro.hasta - ahora };
  };
}

// Limita cuántas peticiones puede hacer una misma dirección en un rato, para que un programa no llene la biblioteca de
// reservas o solicitudes falsas.
function limitar({ ventanaMs = 60 * 1000, maximo = 30, mensaje = 'Hiciste demasiadas peticiones seguidas. Espera un momento e inténtalo de nuevo.' } = {}) {
  const anotar = contador({ ventanaMs });

  return (req, res, next) => {
    const { cantidad, faltanMs } = anotar(req);
    if (cantidad > maximo) {
      res.set('Retry-After', String(Math.ceil(faltanMs / 1000)));
      return fail(res, mensaje, 429);
    }
    return next();
  };
}

// Para lo que nunca debe negarse pero tampoco contarse sin fin (los escaneos de un código QR): dice si la petición todavía cabe en el
// límite de su dirección.
function dentroDelLimite({ ventanaMs = 60 * 1000, maximo = 30 } = {}) {
  const anotar = contador({ ventanaMs });
  return (req) => anotar(req).cantidad <= maximo;
}

// Aplica un limitador solo a las peticiones que escriben datos (POST), dejando libres las lecturas.
function soloEscrituras(limitador) {
  return (req, res, next) => (req.method === 'POST' ? limitador(req, res, next) : next());
}

module.exports = { limitar, soloEscrituras, dentroDelLimite };
