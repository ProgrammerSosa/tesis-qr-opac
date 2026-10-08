import { LIBRARY } from '../config/library';
import { useKiosco } from '../kiosco/KioscoContext';

// Íconos de redes sociales (trazo en línea, mismo estilo que el resto de los íconos). Lucide ya no los incluye.
function Icono({ children, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoFacebook(props) {
  return (
    <Icono {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Icono>
  );
}

export function IconoInstagram(props) {
  return (
    <Icono {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Icono>
  );
}

export function IconoYoutube(props) {
  return (
    <Icono {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </Icono>
  );
}

const REDES = [
  { clave: 'facebook', etiqueta: 'Facebook', href: LIBRARY.redes.facebook, Icono: IconoFacebook },
  { clave: 'instagram', etiqueta: 'Instagram', href: LIBRARY.redes.instagram, Icono: IconoInstagram },
  { clave: 'youtube', etiqueta: 'YouTube', href: LIBRARY.redes.youtube, Icono: IconoYoutube },
];

// Enlaces a las redes de la biblioteca. En un kiosco no se muestran: llevarían a la persona fuera del sistema.
// `variante`: "iconos" (solo el ícono) o "botones" (ícono y nombre). `claro`: para fondos oscuros.
export default function Redes({ variante = 'iconos', claro = false, className = '' }) {
  const { esKiosco } = useKiosco();
  if (esKiosco) return null;

  const base = claro
    ? 'text-white/80 hover:text-white hover:bg-white/15 border-white/20'
    : 'text-slate-600 hover:text-primary hover:bg-blue-50 border-border';

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {REDES.map(({ clave, etiqueta, href, Icono: Glifo }) => (
        <li key={clave}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${etiqueta} de la biblioteca (se abre en otra pestaña)`}
            title={etiqueta}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border transition-colors ${base} ${
              variante === 'botones' ? 'px-3 py-2 text-sm font-semibold' : 'h-9 w-9'
            }`}
          >
            <Glifo size={variante === 'botones' ? 18 : 17} />
            {variante === 'botones' ? etiqueta : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
