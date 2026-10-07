// Comprobaciones de los formularios del sitio público. El servidor repite todas: aquí sirven para avisar de inmediato,
// campo por campo, sin esperar la respuesta.
export function correoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor ?? '').trim());
}

export function textoEntre(valor, minimo, maximo) {
  const longitud = String(valor ?? '').trim().length;
  return longitud >= minimo && longitud <= maximo;
}

// Deja solo los números de lo que se escribió (para el CUI, que a veces se copia con espacios).
export function soloDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

// Si hay algún error en el objeto, devuelve el primero (en el orden de los campos) para llevar el foco ahí.
export function hayErrores(errores) {
  return Object.values(errores).some(Boolean);
}
