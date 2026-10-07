import { useState } from 'react';
import { Library } from 'lucide-react';
import { LIBRARY } from '../config/library';

// Proporción del logo de la biblioteca (frontend/public/logo-biblioteca.png, 210 × 252 px): es más alto que ancho.
const PROPORCION = 210 / 252;

// El logo de la biblioteca, de `tamano` píxeles de alto. Si el archivo no está, se dibuja una marca sencilla en su lugar.
export default function MarcaBiblioteca({ tamano = 52, className = '' }) {
  const [estado, setEstado] = useState('cargando');
  const conLogo = estado === 'ok';

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${conLogo ? 'rounded-lg shadow-md shadow-black/25 ring-1 ring-black/10' : ''} ${className}`}
      style={{ height: tamano, width: conLogo ? Math.round(tamano * PROPORCION) : tamano }}
    >
      <img
        src={LIBRARY.logo}
        alt=""
        height={tamano}
        onLoad={() => setEstado('ok')}
        onError={() => setEstado('falla')}
        className={conLogo ? 'h-full w-full object-cover' : 'hidden'}
      />
      {!conLogo ? (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-primary shadow-lg shadow-black/30 ring-4 ring-primary/40">
          <Library size={Math.round(tamano * 0.5)} strokeWidth={1.75} />
        </span>
      ) : null}
    </span>
  );
}
