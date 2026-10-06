import { Link } from 'react-router-dom';
import { LIBRARY } from '../config/library';
import { useKiosco } from '../kiosco/KioscoContext';

const ENLACES = [
  { to: '/catalogo', label: 'Catálogo de tesis' },
  { to: '/sala-de-estudio', label: 'Sala de estudio' },
  { to: '/solvencia', label: 'Solicitud de solvencia' },
  { to: '/admin', label: 'Panel del personal', soloFueraDeKiosco: true },
];

export default function SiteFooter() {
  const { esKiosco } = useKiosco();
  const enlaces = ENLACES.filter((item) => !(esKiosco && item.soloFueraDeKiosco));

  return (
    <footer className="border-t-4 border-t-action bg-ink text-white print:hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 md:items-center">
        <div>
          <h2 className="text-lg font-bold text-blue-300">Dónde estamos</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-white/80">
            <li>{LIBRARY.ubicacion}</li>
            <li>{LIBRARY.facultad}</li>
            <li>{LIBRARY.universidad}</li>
          </ul>
        </div>

        <p className="text-xl font-medium italic leading-snug md:text-center md:text-2xl">
          <span className="text-red-500">“</span>
          {LIBRARY.lema}
          <span className="text-red-500">”</span>
        </p>

        <div className="md:text-right">
          <h2 className="text-lg font-bold text-blue-300">{LIBRARY.nombreCorto}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-white/80">
            {enlaces.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-white hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={LIBRARY.sitioWeb} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white hover:underline">
                Sitio web de la biblioteca
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
