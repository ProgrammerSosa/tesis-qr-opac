import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useKiosco } from '../kiosco/KioscoContext';

const CAMPOS = [
  { value: 'tema', label: 'Tema o palabra clave' },
  { value: 'titulo', label: 'Título' },
  { value: 'autor', label: 'Autor' },
  { value: 'anio', label: 'Año' },
];

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
      className="flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/40 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-blue-400 sm:flex-row"
    >
      <select
        aria-label="Buscar por"
        value={campo}
        onChange={(e) => setCampo(e.target.value)}
        className="h-14 cursor-pointer border-b border-border bg-surface px-5 text-base font-semibold text-slate-800 outline-none sm:w-64 sm:border-b-0 sm:border-r"
      >
        {CAMPOS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
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
        aria-label="Buscar"
        className="flex h-14 items-center justify-center gap-2 bg-action px-8 font-semibold text-white transition-colors hover:bg-action-dark focus:outline-none"
      >
        <Search size={22} />
        <span className="sm:hidden">Buscar</span>
      </button>
    </form>
  );
}
