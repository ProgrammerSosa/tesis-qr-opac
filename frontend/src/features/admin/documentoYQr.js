import { destinoDelQr } from '../catalog/ThesisQr';
import { revisarUrl } from '../catalog/urlTesis';

// Lo que el formulario de la tesis decide a partir de lo que escribe el personal: si la URL es válida, qué nivel de acceso
// le toca al documento, a dónde lleva el código QR y si ya hay algo que dibujar.
//  - `accesoTocado`: la persona ya eligió el nivel de acceso. Mientras no lo toque, escribir una URL deja el documento en
//    «consulta» y borrarla lo devuelve a «sin acceso», para que no se quede una URL que el público no puede ver.
//  - `destinoQr`: lo que prefiere la persona. Si no hay URL válida o el documento no se ofrece, el código lleva a la ficha.
export function calcularDocumentoYQr({ id, urlTesis, accesoElegido, accesoTocado, destinoQr, activo = true }) {
  const codigo = String(id ?? '').trim();
  const revision = revisarUrl(urlTesis);
  const acceso = accesoTocado ? accesoElegido : revision.url ? 'consulta' : 'sin_acceso';
  const puedeUsarUrl = Boolean(revision.url) && acceso !== 'sin_acceso' && activo;
  const destino = destinoDelQr({ id: codigo, url: revision.url, acceso, activo, destino: destinoQr });
  // El enlace corto y la ficha se arman con el código de la tesis: sin él todavía no hay nada que codificar.
  const sinCodigo = destino.tipo !== 'url' && !codigo;
  return { revision, acceso, puedeUsarUrl, destino, sinCodigo };
}
