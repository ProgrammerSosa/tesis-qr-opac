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

// A dónde lleva el código QR de la etiqueta de una tesis (propuesta, sección 4.3):
//   «url»   — directo a la URL de la tesis, tal como la escribió el personal;
//   «ficha» — a la ficha de la tesis en este sistema, una dirección que no cambia aunque cambie el archivo.
// Sin URL, o si el documento no se ofrece al público (sin acceso o desactivado), el código siempre lleva a la ficha.
// `enlace` es lo que codifica el QR; `visible` es la dirección para mostrar (sin parámetros de seguimiento).
export function destinoDelQr({ id, url, acceso, activo = true, destino = 'url' }) {
  if (url && destino !== 'ficha' && acceso !== 'sin_acceso' && activo) {
    return { tipo: 'url', enlace: url, visible: url };
  }
  return { tipo: 'ficha', enlace: enlaceDeTesis(id), visible: enlaceCanonico(id) };
}

// Lo mismo, a partir de una tesis tal como la entrega el panel (con `documentoDigital` y `qr`).
export function destinoDelQrDe(tesis) {
  const doc = tesis.documentoDigital ?? {};
  return destinoDelQr({ id: tesis.id, url: doc.urlExterna, acceso: doc.acceso, activo: doc.activo, destino: tesis.qr?.destino });
}

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
