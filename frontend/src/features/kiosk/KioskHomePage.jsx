import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { catalogApi } from '../catalog/catalogApi';
import ThesisCard from '../catalog/ThesisCard';
import SectionTitle from '../../shared/components/SectionTitle';

export default function KioskHomePage() {
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    // Sección informativa: si el catálogo no responde, simplemente no se muestra.
    catalogApi
      .buscar({})
      .then((res) => setRecientes([...res.data.data].sort((a, b) => b.anio.localeCompare(a.anio)).slice(0, 4)))
      .catch(() => setRecientes([]));
  }, []);

  if (recientes.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <SectionTitle>Tesis recientes</SectionTitle>
        </div>
        <Link to="/catalogo" className="inline-flex items-center gap-1 pb-2.5 text-sm font-semibold text-primary hover:underline">
          Ver el catálogo
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {recientes.map((t) => (
          <ThesisCard key={t.id} tesis={t} />
        ))}
      </div>
    </section>
  );
}
