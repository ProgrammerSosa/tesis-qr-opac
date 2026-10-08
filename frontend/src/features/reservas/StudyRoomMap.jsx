import {
  BARRA_SALA,
  CUBICULOS,
  DIVISIONES,
  DIVISOR_CENTRAL,
  ESTACIONES,
  MARCO,
  MESAS_SALA,
  RECUADRO_VACIO,
  VIEWBOX,
  ZONAS,
} from './studyRoomLayout';

function alActivar(accion) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      accion();
    }
  };
}

// Colores de las sillas según su estado.
const TONOS = {
  libre: { asiento: 'fill-primary', respaldo: 'fill-primary-dark' },
  ocupado: { asiento: 'fill-action', respaldo: 'fill-red-800' },
  neutra: { asiento: 'fill-slate-500', respaldo: 'fill-slate-700' },
  cargando: { asiento: 'fill-slate-300', respaldo: 'fill-slate-400' },
};

// Mesa vista desde arriba: borde, tablero con bisel, sombra y vetas.
function Mesa({ x, y, width, height, rx = 12, oscura = false, vetas = true }) {
  const horizontal = width > height;
  const lineas = vetas
    ? [0.33, 0.66].map((f) =>
        horizontal
          ? { x1: x + 12, x2: x + width - 12, y1: y + height * f, y2: y + height * f }
          : { x1: x + width * f, x2: x + width * f, y1: y + 12, y2: y + height - 12 }
      )
    : [];

  return (
    <g filter="url(#sombra)">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        strokeWidth={2.5}
        className={`stroke-ink ${oscura ? 'fill-slate-600' : 'fill-slate-300'}`}
      />
      <rect
        x={x + 5}
        y={y + 5}
        width={width - 10}
        height={height - 10}
        rx={Math.max(rx - 4, 2)}
        strokeWidth={1}
        className={oscura ? 'fill-slate-700 stroke-slate-500' : 'fill-slate-100 stroke-slate-400'}
      />
      {lineas.map((l) => (
        <line key={`${l.x1}-${l.y1}`} {...l} strokeWidth={1} strokeLinecap="round" className="stroke-slate-300" />
      ))}
    </g>
  );
}

// Silla vista desde arriba: respaldo, asiento y cojín. `giro` indica hacia dónde mira.
function SillaDibujo({ cx, cy, giro = 0, tono, marca = false, animar = false }) {
  const t = TONOS[tono];
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${giro})`}>
      <g
        className={
          animar ? 'origin-center transition-transform [transform-box:fill-box] group-hover:scale-110 group-focus-visible:scale-110' : ''
        }
      >
        <rect x={-13} y={8} width={26} height={7} rx={3.5} strokeWidth={1.2} className={`stroke-white ${t.respaldo}`} />
        <rect x={-11} y={-11} width={22} height={21} rx={7} strokeWidth={1.2} className={`stroke-white ${t.asiento}`} />
        <rect x={-6.5} y={-6} width={13} height={11} rx={4} fill="white" opacity={0.16} />
        {marca ? <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="white" strokeWidth={2.2} strokeLinecap="round" /> : null}
      </g>
    </g>
  );
}

// Zona activa: sus lugares se pueden reservar. Zona inactiva: queda atenuada y un clic la activa.
function Zona({ activa, onActivar, area, children }) {
  if (activa) {
    return <g>{children}</g>;
  }
  return (
    <g className="cursor-pointer opacity-45 transition-opacity hover:opacity-75" onClick={onActivar}>
      <rect {...area} fill="transparent" />
      {children}
    </g>
  );
}

function Silla({ id, cx, cy, giro, estado, interactivo, seleccionada, onSeleccionar }) {
  if (!interactivo) {
    return <SillaDibujo cx={cx} cy={cy} giro={giro} tono="neutra" />;
  }

  const cargado = Boolean(estado);
  const libre = cargado && estado.libre;
  // Una silla se puede tocar aunque no le queden horas: la reserva avisa que ya está reservada para que elija otra o cambie la hora.
  const etiqueta = cargado ? `${estado.nombre}, ${libre ? 'con horas libres' : 'sin horas libres'}` : id;
  const tono = !cargado ? 'cargando' : libre ? 'libre' : 'ocupado';

  return (
    <g
      role="button"
      tabIndex={cargado ? 0 : -1}
      aria-label={etiqueta}
      onClick={cargado ? () => onSeleccionar(id) : undefined}
      onKeyDown={cargado ? alActivar(() => onSeleccionar(id)) : undefined}
      className={`group outline-none ${cargado ? 'cursor-pointer' : 'cursor-not-allowed'}`}
    >
      <title>{etiqueta}</title>
      <circle cx={cx} cy={cy} r={21} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={20}
        fill="none"
        strokeWidth={3}
        className={
          seleccionada
            ? 'stroke-ink'
            : libre
              ? 'stroke-transparent transition-colors group-hover:stroke-blue-300 group-focus-visible:stroke-ink'
              : 'stroke-transparent'
        }
      />
      <SillaDibujo cx={cx} cy={cy} giro={giro} tono={tono} marca={cargado && !libre} animar={libre} />
    </g>
  );
}

function Cubiculo({ datos, estado, interactivo, seleccionado, onSeleccionar }) {
  const { id, caja, mesa, sillas, nombre: posNombre, puerta } = datos;
  const cargado = Boolean(estado);
  const libre = interactivo && cargado && estado.libre;
  // Un cubículo se puede tocar aunque no le queden horas: la reserva avisa que ya está reservado para que elija otro o cambie la hora.
  const elegible = interactivo && cargado;
  const nombre = estado?.nombre ?? id;
  const resumen = !interactivo || !cargado ? '' : (estado.resumen ?? (libre ? 'Libre' : 'Ocupado'));
  const tonoSillas = !interactivo ? 'neutra' : !cargado ? 'cargando' : libre ? 'libre' : 'ocupado';

  let relleno = 'fill-white';
  if (interactivo && !cargado) relleno = 'fill-slate-50';
  else if (libre && seleccionado) relleno = 'fill-blue-200';
  else if (libre) relleno = 'fill-blue-50 group-hover:fill-blue-100 group-focus-visible:fill-blue-100';
  else if (interactivo) relleno = 'fill-red-50';

  const base = caja.y + caja.height;
  const hoja = puerta.x2 - puerta.x1;
  const paredes =
    `M${caja.x} ${base} V${caja.y} H${caja.x + caja.width} V${base}` +
    ` M${caja.x} ${base} H${puerta.x1} M${puerta.x2} ${base} H${caja.x + caja.width}`;

  const interaccion = interactivo
    ? {
        role: 'button',
        tabIndex: elegible ? 0 : -1,
        'aria-label': `${nombre}${resumen ? `, ${resumen.toLowerCase()}` : ''}`,
        onClick: elegible ? () => onSeleccionar(id) : undefined,
        onKeyDown: elegible ? alActivar(() => onSeleccionar(id)) : undefined,
      }
    : {};

  return (
    <g {...interaccion} className={`group outline-none ${interactivo ? (elegible ? 'cursor-pointer' : 'cursor-not-allowed') : ''}`}>
      {interactivo ? (
        <title>
          {nombre}
          {resumen ? ` · ${resumen.toLowerCase()}` : ''}
        </title>
      ) : null}
      <rect {...caja} className={`transition-colors ${relleno}`} />
      {interactivo && cargado && !libre ? <rect {...caja} fill="url(#patron-ocupado)" /> : null}
      <path d={paredes} fill="none" strokeWidth={5} strokeLinecap="square" className="stroke-ink" />
      <path
        d={`M${puerta.x1} ${base} A${hoja} ${hoja} 0 0 1 ${puerta.x2} ${base - hoja}`}
        fill="none"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        className="stroke-slate-400"
      />
      <line x1={puerta.x2} y1={base} x2={puerta.x2} y2={base - hoja} strokeWidth={3} strokeLinecap="round" className="stroke-ink" />
      {seleccionado ? (
        <rect
          x={caja.x + 6}
          y={caja.y + 6}
          width={caja.width - 12}
          height={caja.height - 12}
          fill="none"
          className="stroke-primary"
          strokeWidth={4}
        />
      ) : null}
      <Mesa {...mesa} rx={8} />
      {sillas.map((s) => (
        <SillaDibujo key={`${s.cx}-${s.cy}`} {...s} tono={tonoSillas} />
      ))}
      <text x={posNombre.x} y={posNombre.y} textAnchor="middle" className="fill-slate-900 text-[14px] font-bold">
        {nombre}
      </text>
      {resumen ? (
        <text
          x={posNombre.x}
          y={posNombre.y + 15}
          textAnchor="middle"
          className={`text-[11px] font-semibold ${libre ? 'fill-primary' : 'fill-action'}`}
        >
          {resumen}
        </text>
      ) : null}
    </g>
  );
}

// Estación: un puesto individual con su escritorio, su número y una sola silla.
function Estacion({ datos, estado, interactivo, seleccionada, onSeleccionar }) {
  const { id, numero, celda, mesa, silla } = datos;
  const cargado = Boolean(estado);
  const libre = interactivo && cargado && estado.libre;
  const ocupada = interactivo && cargado && !libre;
  const nombre = estado?.nombre ?? `Estación ${numero}`;
  const tono = !interactivo ? 'neutra' : !cargado ? 'cargando' : libre ? 'libre' : 'ocupado';

  let relleno = 'fill-transparent';
  if (ocupada) relleno = 'fill-red-50';
  else if (libre && seleccionada) relleno = 'fill-blue-100';
  else if (libre) relleno = 'fill-transparent group-hover:fill-blue-50 group-focus-visible:fill-blue-50';

  // Una estación se puede tocar aunque no le queden horas: la reserva avisa que ya está reservada para que elija otra o cambie la hora.
  const elegible = interactivo && cargado;
  const interaccion = interactivo
    ? {
        role: 'button',
        tabIndex: elegible ? 0 : -1,
        'aria-label': `${nombre}, ${libre ? 'con horas libres' : ocupada ? 'sin horas libres' : 'cargando'}`,
        onClick: elegible ? () => onSeleccionar(id) : undefined,
        onKeyDown: elegible ? alActivar(() => onSeleccionar(id)) : undefined,
      }
    : {};

  return (
    <g {...interaccion} className={`group outline-none ${interactivo ? (elegible ? 'cursor-pointer' : 'cursor-not-allowed') : ''}`}>
      {interactivo ? (
        <title>
          {nombre}
          {cargado ? (libre ? ' · con horas libres' : ' · sin horas libres') : ''}
        </title>
      ) : null}
      <rect
        {...celda}
        rx={6}
        strokeWidth={3}
        className={`transition-colors ${relleno} ${seleccionada ? 'stroke-primary' : 'stroke-transparent'}`}
      />
      <Mesa {...mesa} rx={4} vetas={false} />
      <text
        x={mesa.x + mesa.width / 2}
        y={mesa.y + mesa.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className={`text-[12px] font-bold ${libre ? 'fill-primary' : ocupada ? 'fill-action' : 'fill-slate-400'}`}
      >
        {numero}
      </text>
      <SillaDibujo {...silla} tono={tono} marca={ocupada} animar={libre} />
    </g>
  );
}

function EtiquetaZona({ zona, activa, onClick }) {
  const ancho = zona.titulo.length * 12 + 44;
  return (
    <g onClick={onClick} className="group cursor-pointer">
      <rect
        x={zona.etiqueta.x - ancho / 2}
        y={zona.etiqueta.y - 14}
        width={ancho}
        height={28}
        rx={14}
        strokeWidth={1.5}
        className={`transition-colors ${
          activa ? 'fill-primary stroke-primary' : 'fill-white stroke-slate-300 group-hover:stroke-primary'
        }`}
      />
      <text
        x={zona.etiqueta.x}
        y={zona.etiqueta.y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`text-[13px] font-bold tracking-[0.18em] ${activa ? 'fill-white' : 'fill-slate-500 group-hover:fill-primary'}`}
      >
        {zona.titulo.toUpperCase()}
      </text>
    </g>
  );
}

export default function StudyRoomMap({ zona, onZona, estados, seleccionId, onSeleccionar }) {
  const activa = (key) => zona === key;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      role="group"
      aria-label="Plano de la sala de estudio"
      className="block h-auto w-full select-none"
    >
      <defs>
        <pattern id="patron-ocupado" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="12" stroke="#dc2626" strokeWidth="3" opacity="0.28" />
        </pattern>
        <pattern id="piso" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#e8edf5" strokeWidth="1" />
        </pattern>
        <filter id="sombra" x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28" />
        </filter>
      </defs>

      <rect {...MARCO} rx={8} className="fill-white" />
      <rect {...MARCO} rx={8} fill="url(#piso)" />
      <rect {...RECUADRO_VACIO} className="fill-slate-100" />
      <rect {...MARCO} rx={8} fill="none" strokeWidth={6} className="stroke-ink" />
      <rect {...RECUADRO_VACIO} fill="none" strokeWidth={5} strokeLinecap="square" className="stroke-ink" />

      <Zona
        activa={activa('cubiculos')}
        onActivar={() => onZona('cubiculos')}
        area={{ x: 170, y: 10, width: 1020, height: 165 }}
      >
        {CUBICULOS.map((c) => (
          <Cubiculo
            key={c.id}
            datos={c}
            estado={estados[c.id]}
            interactivo={activa('cubiculos')}
            seleccionado={seleccionId === c.id}
            onSeleccionar={onSeleccionar}
          />
        ))}
      </Zona>

      <Zona activa={activa('estaciones')} onActivar={() => onZona('estaciones')} area={{ x: 20, y: 228, width: 1160, height: 160 }}>
        <rect {...DIVISOR_CENTRAL} rx={2.5} strokeWidth={1} className="fill-slate-700 stroke-white" />
        {DIVISIONES.map((d) => (
          <rect
            key={d.x}
            x={d.x - 2.5}
            y={d.y1}
            width={5}
            height={d.y2 - d.y1}
            rx={2.5}
            strokeWidth={1}
            className="fill-slate-700 stroke-white"
          />
        ))}
        {ESTACIONES.map((e) => (
          <Estacion
            key={e.id}
            datos={e}
            estado={estados[e.id]}
            interactivo={activa('estaciones')}
            seleccionada={seleccionId === e.id}
            onSeleccionar={onSeleccionar}
          />
        ))}
      </Zona>

      <Zona activa={activa('sala')} onActivar={() => onZona('sala')} area={{ x: 20, y: 425, width: 1160, height: 215 }}>
        <Mesa {...BARRA_SALA} rx={6} oscura vetas={false} />
        {MESAS_SALA.map((m) => {
          const cx = m.mesa.x + m.mesa.width / 2;
          const cy = m.mesa.y + m.mesa.height / 2;
          return (
            <g key={m.numero}>
              <Mesa {...m.mesa} rx={14} />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(-90 ${cx} ${cy})`}
                className="fill-slate-400 text-[13px] font-semibold tracking-wider"
              >
                Mesa {m.numero}
              </text>
              {m.sillas.map((s) => (
                <Silla
                  key={s.id}
                  {...s}
                  estado={estados[s.id]}
                  interactivo={activa('sala')}
                  seleccionada={seleccionId === s.id}
                  onSeleccionar={onSeleccionar}
                />
              ))}
            </g>
          );
        })}
      </Zona>

      {ZONAS.map((z) => (
        <EtiquetaZona key={z.key} zona={z} activa={activa(z.key)} onClick={() => onZona(z.key)} />
      ))}
    </svg>
  );
}
