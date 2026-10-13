import { BARRA_SALA, CUBICULOS, DIVISIONES, DIVISOR_CENTRAL, ESTACIONES, MARCO, MESAS_SALA, RECUADRO_VACIO, VIEWBOX, ZONAS } from './studyRoomLayout';

// Plano de la sala de estudio con un solo lugar resaltado: el que tomó una reserva. Sirve para que quien atiende vea de un vistazo
// a dónde va el estudiante y para imprimirlo en la boleta de uso. Es un dibujo fijo, sin nada que tocar, con las mismas medidas y los
// mismos identificadores que el plano de reservas (studyRoomLayout.js). Los colores van escritos en el dibujo para que salgan
// también al imprimir.
const COLOR = {
  piso: '#ffffff',
  muro: '#0f172a',
  vacio: '#f1f5f9',
  mueble: '#e2e8f0',
  borde: '#94a3b8',
  texto: '#64748b',
  resaltado: '#dc2626',
  resaltadoSuave: '#fee2e2',
};

// Dónde está cada lugar en el plano: su centro y, si lo tiene, el recuadro que ocupa.
function ubicacionDe(recursoId) {
  const cubiculo = CUBICULOS.find((c) => c.id === recursoId);
  if (cubiculo) return { x: cubiculo.caja.x + cubiculo.caja.width / 2, y: cubiculo.caja.y + cubiculo.caja.height / 2 };
  const estacion = ESTACIONES.find((e) => e.id === recursoId);
  if (estacion) return { x: estacion.celda.x + estacion.celda.width / 2, y: estacion.celda.y + estacion.celda.height / 2 };
  for (const mesa of MESAS_SALA) {
    const silla = mesa.sillas.find((s) => s.id === recursoId);
    if (silla) return { x: silla.cx, y: silla.cy };
  }
  return null;
}

const numeroDe = (id) => id.split('-').pop();

export default function PlanoDelLugar({ recursoId, nombre, className = '' }) {
  const ubicacion = ubicacionDe(recursoId);
  const es = (id) => id === recursoId;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      role="img"
      aria-label={ubicacion ? `Plano de la sala: ${nombre ?? recursoId} resaltado` : 'Plano de la sala de estudio'}
      className={`block h-auto w-full select-none ${className}`}
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      <rect {...MARCO} rx={8} fill={COLOR.piso} />
      <rect {...RECUADRO_VACIO} fill={COLOR.vacio} />

      {CUBICULOS.map((c) => (
        <g key={c.id}>
          <rect
            {...c.caja}
            fill={es(c.id) ? COLOR.resaltadoSuave : COLOR.piso}
            stroke={es(c.id) ? COLOR.resaltado : COLOR.borde}
            strokeWidth={es(c.id) ? 7 : 2}
          />
          <rect {...c.mesa} rx={6} fill={COLOR.mueble} stroke={COLOR.borde} strokeWidth={1.5} />
          {c.sillas.map((s) => (
            <circle key={`${s.cx}-${s.cy}`} cx={s.cx} cy={s.cy} r={9} fill={COLOR.mueble} stroke={COLOR.borde} strokeWidth={1.5} />
          ))}
          <text x={c.nombre.x} y={c.nombre.y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill={es(c.id) ? COLOR.resaltado : COLOR.texto}>
            Cubículo {numeroDe(c.id)}
          </text>
        </g>
      ))}

      <rect {...DIVISOR_CENTRAL} rx={2.5} fill={COLOR.borde} />
      {DIVISIONES.map((d) => (
        <rect key={d.x} x={d.x - 2} y={d.y1} width={4} height={d.y2 - d.y1} rx={2} fill={COLOR.borde} />
      ))}
      {ESTACIONES.map((e) => (
        <g key={e.id}>
          <rect
            {...e.celda}
            rx={5}
            fill={es(e.id) ? COLOR.resaltadoSuave : COLOR.piso}
            stroke={es(e.id) ? COLOR.resaltado : 'none'}
            strokeWidth={es(e.id) ? 6 : 0}
          />
          <rect {...e.mesa} rx={4} fill={COLOR.mueble} stroke={COLOR.borde} strokeWidth={1.5} />
          <circle cx={e.silla.cx} cy={e.silla.cy} r={8} fill={es(e.id) ? COLOR.resaltado : COLOR.mueble} stroke={COLOR.borde} strokeWidth={1.5} />
          <text x={e.mesa.x + e.mesa.width / 2} y={e.mesa.y + e.mesa.height / 2} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fill={COLOR.texto}>
            {e.numero}
          </text>
        </g>
      ))}

      <rect {...BARRA_SALA} rx={6} fill={COLOR.mueble} stroke={COLOR.borde} strokeWidth={1.5} />
      {MESAS_SALA.map((m) => {
        const cx = m.mesa.x + m.mesa.width / 2;
        const cy = m.mesa.y + m.mesa.height / 2;
        return (
          <g key={m.numero}>
            <rect {...m.mesa} rx={12} fill={COLOR.mueble} stroke={COLOR.borde} strokeWidth={1.5} />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" transform={`rotate(-90 ${cx} ${cy})`} fontSize={14} fontWeight={600} fill={COLOR.texto}>
              Mesa {m.numero}
            </text>
            {m.sillas.map((s) => (
              <circle key={s.id} cx={s.cx} cy={s.cy} r={es(s.id) ? 15 : 11} fill={es(s.id) ? COLOR.resaltado : COLOR.piso} stroke={es(s.id) ? COLOR.resaltado : COLOR.borde} strokeWidth={2} />
            ))}
          </g>
        );
      })}

      {ZONAS.map((z) => (
        <text key={z.key} x={z.etiqueta.x} y={z.etiqueta.y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} letterSpacing={3} fill={COLOR.texto}>
          {z.titulo.toUpperCase()}
        </text>
      ))}

      <rect {...MARCO} rx={8} fill="none" stroke={COLOR.muro} strokeWidth={6} />
      <rect {...RECUADRO_VACIO} fill="none" stroke={COLOR.muro} strokeWidth={5} />

      {/* La marca encima de todo, para que se vea aunque el plano salga pequeño. */}
      {ubicacion ? (
        <g aria-hidden="true">
          <circle cx={ubicacion.x} cy={ubicacion.y} r={38} fill={COLOR.resaltado} opacity={0.16} />
          <circle cx={ubicacion.x} cy={ubicacion.y} r={15} fill={COLOR.resaltado} stroke="#ffffff" strokeWidth={5} />
        </g>
      ) : null}
    </svg>
  );
}
