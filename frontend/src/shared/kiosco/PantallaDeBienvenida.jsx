import MarcaBiblioteca from '../components/MarcaBiblioteca';
import { LIBRARY } from '../config/library';

// Pantalla de bienvenida del kiosco. Tapa todo hasta que alguien la toca: ese toque es el gesto que el navegador exige para
// entrar en pantalla completa. Vuelve a aparecer cuando la sesión se reinicia por inactividad y si se sale de la pantalla completa.
export default function PantallaDeBienvenida({ kiosco, onComenzar }) {
  return (
    <button
      type="button"
      onClick={onComenzar}
      aria-label="Toca la pantalla para comenzar"
      className="hero-bg fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center gap-8 px-6 text-center text-white outline-none print:hidden"
    >
      <MarcaBiblioteca tamano={132} />
      <span className="flex max-w-3xl flex-col gap-3">
        <span className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{LIBRARY.nombre}</span>
        <span className="text-lg text-white/80">{LIBRARY.facultad} · USAC</span>
        <span className="text-xl text-blue-100">{LIBRARY.descripcion}</span>
      </span>
      <span className="mt-4 animate-pulse rounded-full bg-action px-12 py-5 text-2xl font-bold shadow-2xl shadow-black/40">Toca la pantalla para comenzar</span>
      {kiosco ? <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">Kiosco {kiosco}</span> : null}
    </button>
  );
}
