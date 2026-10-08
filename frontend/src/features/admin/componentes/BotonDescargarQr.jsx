import { useRef } from 'react';
import { Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { nivelDeCorreccion } from '../../catalog/ThesisQr';
import Button from '../../../shared/components/Button';

// Descarga el código QR como imagen PNG grande (para usarlo en otro programa o llevarlo a una imprenta). El código se dibuja
// aparte, en grande y con su margen blanco, sin mostrarse en pantalla.
export default function BotonDescargarQr({ valor, nombreArchivo, texto = 'Descargar QR (PNG)', variante = 'secondary', className = '' }) {
  const lienzo = useRef(null);

  function descargar() {
    const canvas = lienzo.current;
    if (!canvas) return;
    const enlace = document.createElement('a');
    enlace.href = canvas.toDataURL('image/png');
    enlace.download = nombreArchivo;
    enlace.click();
  }

  return (
    <>
      <Button type="button" variant={variante} icon={Download} className={className} onClick={descargar} disabled={!valor}>
        {texto}
      </Button>
      {valor ? (
        <QRCodeCanvas
          ref={lienzo}
          value={valor}
          size={640}
          marginSize={4}
          level={nivelDeCorreccion(valor)}
          fgColor="#111827"
          bgColor="#ffffff"
          className="hidden"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}
