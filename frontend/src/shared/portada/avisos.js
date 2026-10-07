import { useMemo } from 'react';
import { usePortada } from './PortadaContext';
import { fechaConMes, fechaLarga, hoyISO, sumarDias } from '../utils/fechas';

// Cierres de la biblioteca (asuetos, inventario...) redactados como un aviso. El que está en curso se anuncia siempre;
// los que vienen, solo cuando faltan siete días o menos.
export function avisosDeCierres(horario) {
  if (!horario) return [];
  const hoy = hoyISO();
  const limite = sumarDias(hoy, 7);
  return (horario.proximosCierres ?? [])
    .filter((c) => c.desde <= limite)
    .map((c) => {
      const enCurso = c.desde <= hoy && hoy <= c.hasta;
      const rango = c.desde === c.hasta ? `el ${fechaLarga(c.desde)}` : `del ${fechaConMes(c.desde)} al ${fechaConMes(c.hasta)}`;
      return {
        id: `cierre-${c.id}`,
        tipo: 'cierre',
        titulo: enCurso ? 'La biblioteca está cerrada' : 'Cierre de la biblioteca',
        texto: enCurso ? `${c.motivo}. Hoy no hay atención ni reservas.` : `${c.motivo}: no habrá atención ${rango}.`,
      };
    });
}

// Todos los avisos que se muestran en el inicio: primero los cierres próximos y luego los que publica el personal.
export function useAvisos() {
  const { portada } = usePortada();
  return useMemo(() => [...avisosDeCierres(portada?.horario), ...(portada?.avisos ?? [])], [portada]);
}
