import { QRCodeCanvas } from 'qrcode.react';

// La ficha de la tesis es una dirección estable: si algún día cambia dónde está el archivo digital, se actualiza el destino
// en el sistema y las etiquetas ya pegadas siguen funcionando (propuesta, sección 4.3).
// `origen=qr` permite contar cuántas personas llegan escaneando el código.
export function enlaceCanonico(id) {
  return `${window.location.origin}/tesis/${id}`;
}

export function enlaceDeTesis(id) {
  return `${window.location.origin}/tesis/${id}?origen=qr`;
}

export function enlaceDeDocumento(id) {
  return `${window.location.origin}/tesis/${id}/documento?origen=qr`;
}

// Texto alternativo para quien no puede escanear: la misma dirección, sin lo que sobra.
export function enlaceEscrito(id) {
  return `${window.location.host}/tesis/${id}`;
}

// Enlace corto del código QR: el servidor lo recibe, cuenta el escaneo y abre la URL de la tesis que esté guardada en ese momento.
export function enlaceCorto(id) {
  return `${window.location.origin}/r/${encodeURIComponent(id)}`;
}

// A dónde lleva el código QR de la etiqueta de una tesis (propuesta, sección 4.3):
//   «enlace» — al enlace corto de este sistema, que abre la URL de la tesis: si la URL cambia, la etiqueta ya impresa sigue sirviendo,
//              y se cuentan los escaneos (es lo que se usa por defecto);
//   «url»    — la URL de la tesis tal cual, escrita dentro del código;
//   «ficha»  — a la ficha de la tesis en este sistema.
// Sin URL, o si el documento no se ofrece al público (sin acceso o desactivado), el código siempre lleva a la ficha.
// `enlace` es lo que codifica el QR; `visible` es la dirección para mostrar (sin parámetros de seguimiento); `abre` es la URL de la
// tesis a la que termina llevando, cuando el código va al documento.
export function destinoDelQr({ id, url, acceso, activo = true, destino = 'enlace' }) {
  const hayUrl = Boolean(url) && acceso !== 'sin_acceso' && activo;
  if (hayUrl && destino === 'url') {
    return { tipo: 'url', enlace: url, visible: url, abre: url };
  }
  if (hayUrl && destino === 'enlace') {
    return { tipo: 'enlace', enlace: enlaceCorto(id), visible: enlaceCorto(id), abre: url };
  }
  return { tipo: 'ficha', enlace: enlaceDeTesis(id), visible: enlaceCanonico(id), abre: null };
}

// Lo mismo, a partir de una tesis tal como la entrega el panel (con `documentoDigital` y `qr`).
export function destinoDelQrDe(tesis) {
  const doc = tesis.documentoDigital ?? {};
  return destinoDelQr({ id: tesis.id, url: doc.urlExterna, acceso: doc.acceso, activo: doc.activo, destino: tesis.qr?.destino });
}

// El código QR que se muestra en el sitio público: el mismo que va impreso en la etiqueta. La ficha pública trae a dónde lleva
// (`qr.destino`) y, solo si el código lleva la URL tal cual, esa URL (`qr.enlace`). `siEsFicha` es lo que se codifica cuando el código
// lleva a la ficha (por defecto, la ficha misma).
export function enlacePublicoDelQr(tesis, siEsFicha = enlaceDeTesis(tesis.id)) {
  if (tesis.qr?.destino === 'url' && tesis.qr.enlace) return tesis.qr.enlace;
  if (tesis.qr?.destino === 'enlace') return enlaceCorto(tesis.id);
  return siEsFicha;
}

// Nombre de cada destino, para mostrarlo en el panel.
export const NOMBRE_DEL_DESTINO = { enlace: 'Enlace corto', url: 'URL tal cual', ficha: 'Ficha de la tesis' };

// Un enlace largo necesita un código más denso: se baja la corrección de errores para que los cuadros no se vuelvan diminutos.
export const nivelDeCorreccion = (valor) => (valor.length > 60 ? 'L' : 'M');

export default function ThesisQr({ id, size = 80, enlace }) {
  const valor = enlace || enlaceDeTesis(id);
  return (
    <div className="flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5" style={{ width: size + 12, height: size + 12 }}>
      <QRCodeCanvas value={valor} size={size} level={nivelDeCorreccion(valor)} fgColor="#111827" bgColor="#ffffff" />
    </div>
  );
}
