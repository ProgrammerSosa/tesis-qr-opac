// La URL de la tesis que escribe el personal (el enlace de acceso a su documento digital). Se comprueba y se normaliza igual
// que en el servidor, para que el código QR que se ve en pantalla sea idéntico al que queda guardado y se imprime.
export const MAXIMO_DE_URL = 2000;

// Devuelve { vacia, url, error }: `url` es la dirección normalizada cuando es válida; `error` explica qué corregir.
export function revisarUrl(texto) {
  const limpio = String(texto ?? '').trim();
  if (!limpio) return { vacia: true, url: '', error: '' };
  if (limpio.length > MAXIMO_DE_URL) {
    return { vacia: false, url: '', error: `La URL es demasiado larga (máximo ${MAXIMO_DE_URL} caracteres)` };
  }
  let url = null;
  try {
    url = /\s/.test(limpio) ? null : new URL(limpio);
  } catch {
    url = null;
  }
  if (!url || !['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    return { vacia: false, url: '', error: 'Escribe la URL completa, empezando con http:// o https:// y sin espacios' };
  }
  return { vacia: false, url: url.href, error: '' };
}
