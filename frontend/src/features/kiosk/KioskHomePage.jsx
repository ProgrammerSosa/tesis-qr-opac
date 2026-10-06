import { Link } from 'react-router-dom';
import { Search, DoorOpen, Armchair, FileCheck2, ArrowRight } from 'lucide-react';

const OPCIONES = [
  {
    to: '/catalogo',
    icon: Search,
    titulo: 'Buscar una tesis',
    texto: 'Catálogo de acceso público (OPAC): busca por autor, título, año o tema y escanea el QR de la ficha.',
  },
  {
    to: '/cubiculos',
    icon: DoorOpen,
    titulo: 'Reservar un cubículo',
    texto: 'Consulta disponibilidad por fecha y hora, y reserva un cubículo para trabajo en grupo.',
  },
  {
    to: '/espacios-estudio',
    icon: Armchair,
    titulo: 'Reservar espacio de estudio',
    texto: 'Reserva una mesa individual de estudio en la sala general de la biblioteca.',
  },
  {
    to: '/solvencia',
    icon: FileCheck2,
    titulo: 'Solicitud de solvencia',
    texto: 'Inicia el trámite de paz y salvo bibliotecario sin tener que hacer fila en el mostrador.',
  },
];

export default function KioskHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Pantalla principal</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-primary-dark">¿Qué deseas hacer hoy?</h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">
          Selecciona una opción en la pantalla del kiosco. Cada trámite entrega un comprobante digital y, si lo prefieres, uno
          físico en el mostrador.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPCIONES.map((op) => (
          <Link
            key={op.to}
            to={op.to}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-white p-5 transition-colors hover:border-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <op.icon size={20} />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-primary-dark">{op.titulo}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{op.texto}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-accent">
              Continuar
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
