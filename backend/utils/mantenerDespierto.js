// Mantener despierto el servicio gratuito de Render, sin cuentas ni servicios externos.
// Render apaga el plan gratuito tras 15 minutos sin visitas. El servidor se visita a sí mismo por su dirección pública
// (la que pone Render en RENDER_EXTERNAL_URL): esa petición entra por el proxy de Render y cuenta como visita.
//   KEEPALIVE_URL      dirección pública a visitar (por defecto RENDER_EXTERNAL_URL; sin ninguna de las dos no se hace nada)
//   KEEPALIVE_MINUTOS  cada cuántos minutos (por defecto 10; debe ser menor que 15)
//   KEEPALIVE=0        lo apaga
// Solo evita que se duerma mientras está despierto: si ya se durmió, la primera visita lo despierta (cerca de un minuto).
// Un mes tiene unas 744 horas y el plan gratuito da 750 por espacio de trabajo: alcanza para UN servicio encendido todo el mes.
const MINUTOS_POR_DEFECTO = 10;

function direccionAVisitar(env = process.env) {
  if (env.KEEPALIVE === '0' || env.KEEPALIVE === 'false') return null;
  const base = String(env.KEEPALIVE_URL || env.RENDER_EXTERNAL_URL || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) return null;
  return `${base}/health`;
}

function minutosEntreVisitas(env = process.env) {
  const n = Number(env.KEEPALIVE_MINUTOS);
  return Number.isFinite(n) && n >= 1 && n < 15 ? n : MINUTOS_POR_DEFECTO;
}

function mantenerDespierto({ env = process.env, visitar = fetch, registro = console } = {}) {
  const url = direccionAVisitar(env);
  if (!url) return null;
  const minutos = minutosEntreVisitas(env);
  const latido = async () => {
    try {
      const res = await visitar(url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'biblioteca-keepalive' } });
      if (!res.ok) registro.warn(`[keepalive] ${url} respondió ${res.status}`);
    } catch (error) {
      registro.warn(`[keepalive] No se pudo visitar ${url}: ${error.message}`);
    }
  };
  const reloj = setInterval(latido, minutos * 60 * 1000);
  reloj.unref(); // no impide que el proceso termine
  registro.log(`[keepalive] Se visitará ${url} cada ${minutos} minutos para que Render no lo duerma`);
  return reloj;
}

module.exports = { mantenerDespierto, direccionAVisitar, minutosEntreVisitas };
