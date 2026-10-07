import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useKiosco } from '../kiosco/KioscoContext';

const CAMPOS = [
  { value: 'tema', label: 'Tema o palabra clave' },
  { value: 'titulo', label: 'Título' },
  { value: 'autor', label: 'Autor' },
  { value: 'anio', label: 'Año' },
];

// El buscador grande del inicio: se elige por qué campo buscar, se escribe y se pasa al catálogo con esos criterios.
export default function HeroSearch() {
  const navigate = useNavigate();
  const { registrarEvento } = useKiosco();
  const [campo, setCampo] = useState('tema');
  const [texto, setTexto] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    registrarEvento('busqueda_opac');
    navigate(`/catalogo?${campo}=${encodeURIComponent(texto.trim())}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/40 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-blue-400 sm:flex-row"
    >
      <div className="relative border-b border-border bg-surface sm:w-60 sm:border-b-0 sm:border-r">
        <select
          aria-label="Buscar por"
          value={campo}
          onChange={(e) => setCampo(e.target.value)}
          className="h-14 w-full cursor-pointer appearance-none bg-transparent pl-5 pr-10 text-base font-semibold text-slate-800 outline-none"
        >
          {CAMPOS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      </div>
      <input
        type="search"
        aria-label="Buscar en el catálogo"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Busca tesis por tema, título, autor o año"
        className="h-14 min-w-0 flex-1 bg-white px-5 text-base text-slate-900 outline-none placeholder:text-slate-400"
      />
      <button
        type="submit"
        className="flex h-14 items-center justify-center gap-2 bg-action px-8 text-base font-bold text-white transition-colors hover:bg-action-dark focus:outline-none focus-visible:bg-action-dark"
      >
        <Search size={20} aria-hidden="true" />
        Buscar
      </button>
    </form>
  );
}
