import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarX, Megaphone, TriangleAlert, X } from 'lucide-react';
import Container from './Container';
import { usePortada } from '../portada/PortadaContext';
import { avisosDeCierres, useAvisos } from '../portada/avisos';
import { fechaConMes } from '../utils/fechas';

const ESTILOS = {
  importante: { caja: 'border-l-action bg-red-50/70', icono: Megaphone, color: 'text-action', etiqueta: 'Importante' },
  cierre: { caja: 'border-l-amber-500 bg-amber-50/80', icono: CalendarX, color: 'text-amber-600', etiqueta: 'Cierre' },
  info: { caja: 'border-l-primary bg-blue-50/70', icono: Megaphone, color: 'text-primary', etiqueta: 'Aviso' },
};

// Los avisos del inicio: los que publica el personal y, primero, los cierres próximos.
export function ListaDeAvisos({ className = '' }) {
  const avisos = useAvisos();
  if (avisos.length === 0) return null;

  return (
    <ul className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {avisos.map((aviso) => {
        const estilo = ESTILOS[aviso.tipo] ?? ESTILOS.info;
        const Icono = estilo.icono;
        return (
          <li key={aviso.id} className={`rounded-xl border border-border border-l-4 p-5 ${estilo.caja}`}>
            <div className="flex items-start gap-3">
              <Icono size={20} className={`mt-0.5 shrink-0 ${estilo.color}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${estilo.color}`}>{estilo.etiqueta}</p>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">{aviso.titulo}</h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{aviso.texto}</p>
                {aviso.publicadoEn ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Publicado el {fechaConMes(aviso.publicadoEn.slice(0, 10))}
                    {aviso.vigenteHasta ? ` · vigente hasta el ${fechaConMes(aviso.vigenteHasta)}` : ''}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function leerCerrados() {
  try {
    return JSON.parse(sessionStorage.getItem('avisos_cerrados') || '[]');
  } catch {
    return [];
  }
}

// La franja que aparece arriba en todas las páginas con lo que no se puede pasar por alto: el cierre de la biblioteca
// y los avisos marcados como importantes. Quien la cierra no la vuelve a ver mientras no cierre la pestaña.
export function FranjaDeAvisos() {
  const { portada } = usePortada();
  const [cerrados, setCerrados] = useState(leerCerrados);

  const importantes = useMemo(() => {
    const delPersonal = (portada?.avisos ?? []).filter((a) => a.tipo === 'importante');
    return [...avisosDeCierres(portada?.horario), ...delPersonal].filter((a) => !cerrados.includes(a.id)).slice(0, 2);
  }, [portada, cerrados]);

  if (importantes.length === 0) return null;

  function cerrar(id) {
    const nuevos = [...cerrados, id];
    setCerrados(nuevos);
    try {
      sessionStorage.setItem('avisos_cerrados', JSON.stringify(nuevos));
    } catch {
      // sin almacenamiento: el aviso se oculta solo hasta que se recargue la página
    }
  }

  return (
    <div className="print:hidden">
      {importantes.map((aviso) => (
        <div key={aviso.id} role="status" className={aviso.tipo === 'cierre' ? 'bg-amber-100 text-amber-950' : 'bg-action text-white'}>
          <Container className="flex items-start gap-3 py-2.5 text-sm">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 leading-snug">
              <b>{aviso.titulo}.</b> <span className="whitespace-pre-line">{aviso.texto}</span>{' '}
              <Link to="/#avisos" className="font-semibold underline underline-offset-2">
                Ver avisos
              </Link>
            </p>
            <button
              type="button"
              onClick={() => cerrar(aviso.id)}
              aria-label="Cerrar este aviso"
              className="-mr-1 shrink-0 rounded-md p-1 opacity-80 transition-opacity hover:bg-black/10 hover:opacity-100"
            >
              <X size={18} />
            </button>
          </Container>
        </div>
      ))}
    </div>
  );
}
