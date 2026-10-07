import { ExternalLink } from 'lucide-react';
import { useKiosco } from '../kiosco/KioscoContext';

// Enlace a otro sitio. En un kiosco no se puede abrir (sacaría a la persona del sistema y dejaría su sesión abierta):
// se muestra el texto, para que lo anote.
export default function EnlaceExterno({ href, children, className = '', conIcono = true }) {
  const { esKiosco } = useKiosco();
  if (esKiosco) return <span className={className}>{children}</span>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      {conIcono ? <ExternalLink size={14} className="ml-1.5 inline-block align-[-2px]" aria-hidden="true" /> : null}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );
}
