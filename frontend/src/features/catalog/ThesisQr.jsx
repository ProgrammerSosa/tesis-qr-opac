import { QRCodeCanvas } from 'qrcode.react';

// El QR apunta a la ficha de la tesis, una dirección estable: si algún día cambia dónde está el archivo digital,
// se actualiza el destino en el sistema y las etiquetas ya pegadas siguen funcionando (propuesta, sección 4.3).
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

export default function ThesisQr({ id, size = 80, enlace }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5" style={{ width: size + 12, height: size + 12 }}>
      <QRCodeCanvas value={enlace || enlaceDeTesis(id)} size={size} fgColor="#111827" bgColor="#ffffff" />
    </div>
  );
}
