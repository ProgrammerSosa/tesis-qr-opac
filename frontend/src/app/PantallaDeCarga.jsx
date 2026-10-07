import { Loader2 } from 'lucide-react';

// Lo que se ve un instante mientras se descarga el código de la página (solo en la primera visita).
export default function PantallaDeCarga() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-white text-slate-500">
      <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
