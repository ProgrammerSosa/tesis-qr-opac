import { QRCodeCanvas } from 'qrcode.react';

export function enlaceDeTesis(id) {
  return `${window.location.origin}/tesis/${id}`;
}

export default function ThesisQr({ id, size = 80 }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-lg bg-white p-1.5" style={{ width: size + 12, height: size + 12 }}>
      <QRCodeCanvas value={enlaceDeTesis(id)} size={size} fgColor="#111827" bgColor="#ffffff" />
    </div>
  );
}
