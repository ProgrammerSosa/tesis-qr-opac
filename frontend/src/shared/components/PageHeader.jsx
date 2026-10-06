import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1.5 rounded-md bg-surface px-3.5 py-2.5 text-sm text-slate-600">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 ? <ChevronRight size={14} className="text-slate-400" /> : null}
          {item.to ? (
            <Link to={item.to} className="text-primary hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function PageHeader({ crumbs, title, subtitle }) {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={crumbs} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}
