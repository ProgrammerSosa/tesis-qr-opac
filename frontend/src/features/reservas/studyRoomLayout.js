import { BookOpen, DoorOpen, Monitor } from 'lucide-react';

// Plano 2D de la sala de estudio, en unidades del viewBox del SVG.
// Los identificadores coinciden con los del backend (backend/src/reservas/recursos_data.js).
// `giro` es el ángulo en grados hacia donde mira la silla: 0 = hacia arriba, 90 = derecha, 180 = abajo, -90 = izquierda.
export const VIEWBOX = { width: 1200, height: 700 };
export const MARCO = { x: 10, y: 10, width: 1180, height: 680 };

export const ZONAS = [
  {
    key: 'cubiculos',
    tipo: 'cubiculo',
    titulo: 'Cubículos',
    descripcion: 'Salas cerradas para trabajo en grupo, hasta 5 personas.',
    icon: DoorOpen,
    etiqueta: { x: 600, y: 196 },
  },
  {
    key: 'estaciones',
    tipo: 'estacion',
    titulo: 'Estaciones',
    descripcion: '30 puestos individuales con escritorio y una sola silla.',
    icon: Monitor,
    etiqueta: { x: 600, y: 404 },
  },
  {
    key: 'sala',
    tipo: 'sala_lectura',
    titulo: 'Sala de lectura',
    descripcion: 'Mesas compartidas de 6 sillas para estudio en silencio.',
    icon: BookOpen,
    etiqueta: { x: 600, y: 664 },
  },
];

// --- Cubículos: una fila de salas con puerta; el primer recuadro queda vacío, como en el boceto.
const CUBICULO_X0 = 170;
const CUBICULO_ANCHO = 170;
const BANDA = { y: 10, height: 165 };

export const RECUADRO_VACIO = { x: MARCO.x, y: BANDA.y, width: CUBICULO_X0 - MARCO.x, height: BANDA.height };

// La numeración va de derecha a izquierda: el cubículo 1 es el del extremo derecho y el 6 el más cercano al recuadro vacío.
const CUBICULOS_TOTAL = 6;

export const CUBICULOS = Array.from({ length: CUBICULOS_TOTAL }, (_, i) => {
  const x = CUBICULO_X0 + i * CUBICULO_ANCHO;
  const cx = x + CUBICULO_ANCHO / 2;
  const base = BANDA.y + BANDA.height;
  return {
    id: `cub-${CUBICULOS_TOTAL - i}`,
    caja: { x, y: BANDA.y, width: CUBICULO_ANCHO, height: BANDA.height },
    mesa: { x: cx - 30, y: 62, width: 60, height: 50 },
    sillas: [
      { cx: cx - 47, cy: 74, giro: 90 },
      { cx: cx - 47, cy: 100, giro: 90 },
      { cx: cx + 47, cy: 74, giro: -90 },
      { cx: cx + 47, cy: 100, giro: -90 },
      { cx, cy: 130, giro: 0 },
    ],
    nombre: { x: cx, y: 31 },
    puerta: { x1: x + 14, x2: x + 54, y: base },
  };
});

// --- Estaciones: 30 puestos individuales, cada uno con su escritorio y una sola silla.
// Van en dos filas de 15, espalda con espalda, separadas por un divisor central y por divisiones laterales.
// La numeración recorre el salón en U: la fila de abajo va de izquierda a derecha (1 a 15)
// y la de arriba regresa de derecha a izquierda (16 a 30), así que el 30 queda arriba a la izquierda.
const ESTACION_X0 = 135;
const ESTACION_ANCHO = 62;
const ESTACIONES_POR_FILA = 15;
const CENTRO_Y = 310;
const ESTACION_FILAS = [
  { celdaY: 243, mesaY: 272, sillaY: 258, giro: 180, numeroEn: (i) => 2 * ESTACIONES_POR_FILA - i },
  { celdaY: 313, mesaY: 316, sillaY: 362, giro: 0, numeroEn: (i) => i + 1 },
];

export const ESTACIONES = ESTACION_FILAS.flatMap((fila) =>
  Array.from({ length: ESTACIONES_POR_FILA }, (_, i) => {
    const x = ESTACION_X0 + i * ESTACION_ANCHO;
    const numero = fila.numeroEn(i);
    return {
      id: `est-${numero}`,
      numero,
      celda: { x: x + 3, y: fila.celdaY, width: ESTACION_ANCHO - 6, height: 64 },
      mesa: { x: x + 7, y: fila.mesaY, width: ESTACION_ANCHO - 14, height: 32 },
      silla: { cx: x + ESTACION_ANCHO / 2, cy: fila.sillaY, giro: fila.giro },
    };
  })
);

export const DIVISIONES = Array.from({ length: ESTACIONES_POR_FILA + 1 }, (_, i) => ({
  x: ESTACION_X0 + i * ESTACION_ANCHO,
  y1: 240,
  y2: 380,
}));

export const DIVISOR_CENTRAL = { x: ESTACION_X0, y: CENTRO_Y - 2.5, width: ESTACIONES_POR_FILA * ESTACION_ANCHO, height: 5 };

// --- Sala de lectura: una barra superior y cinco mesas con tres sillas por lado.
export const BARRA_SALA = { x: 170, y: 438, width: 860, height: 32 };

export const MESAS_SALA = Array.from({ length: 5 }, (_, m) => {
  const cx = 250 + m * 175;
  const silla = (lado, k) => ({
    id: `sala-m${m + 1}-s${lado === 'izq' ? k + 1 : k + 4}`,
    cx: lado === 'izq' ? cx - 54 : cx + 54,
    cy: 528 + k * 44,
    giro: lado === 'izq' ? 90 : -90,
  });
  return {
    numero: m + 1,
    mesa: { x: cx - 40, y: 506, width: 80, height: 132 },
    sillas: [0, 1, 2].map((k) => silla('izq', k)).concat([0, 1, 2].map((k) => silla('der', k))),
  };
});
