// Comparación de direcciones IP contra una lista escrita a mano ("192.168.1.20, 192.168.1.30" o un rango como
// "192.168.1.0/28"). Se usa para saber si una petición viene de un kiosco de la biblioteca (variable KIOSCOS_IP).

function normalizar(direccion) {
  return String(direccion ?? '').trim().replace(/^::ffff:/i, ''); // una IPv4 puede llegar como "::ffff:192.168.1.20"
}

function ipv4ANumero(direccion) {
  const partes = direccion.split('.');
  if (partes.length !== 4 || partes.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
  return partes.reduce((total, p) => total * 256 + Number(p), 0);
}

// Devuelve una función que dice si una dirección está en la lista. Acepta direcciones sueltas y rangos IPv4 con /bits.
function crearComprobadorDeDirecciones(texto) {
  const exactas = new Set();
  const rangos = [];
  String(texto ?? '')
    .split(',')
    .map(normalizar)
    .filter(Boolean)
    .forEach((entrada) => {
      const [base, bits] = entrada.split('/');
      const numero = ipv4ANumero(base);
      if (bits !== undefined && numero !== null && /^\d{1,2}$/.test(bits) && Number(bits) <= 32) {
        const tamano = 2 ** (32 - Number(bits));
        rangos.push([Math.floor(numero / tamano) * tamano, tamano]);
      } else {
        exactas.add(entrada.toLowerCase());
      }
    });

  const hayLista = exactas.size > 0 || rangos.length > 0;
  const comprobar = (direccion) => {
    const ip = normalizar(direccion).toLowerCase();
    if (exactas.has(ip)) return true;
    const numero = ipv4ANumero(ip);
    return numero !== null && rangos.some(([inicio, tamano]) => numero >= inicio && numero < inicio + tamano);
  };
  comprobar.hayLista = hayLista;
  return comprobar;
}

module.exports = { crearComprobadorDeDirecciones };
