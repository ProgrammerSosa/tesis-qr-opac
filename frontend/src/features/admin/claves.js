// Largo mínimo de una clave del personal (el servidor exige lo mismo).
export const LARGO_MINIMO_DE_CLAVE = 8;

// Letras y números sin los que se confunden al leerlos (0/o, 1/l), para que la clave se pueda dictar o copiar sin error.
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generarClave(largo = 12) {
  const azar = crypto.getRandomValues(new Uint32Array(largo));
  return Array.from(azar, (n) => ALFABETO[n % ALFABETO.length]).join('');
}
