// src/app/core/utils/colores-asignatura.ts
// Un mismo color por materia en TODO el sistema (pantalla, Excel y PDF)

export interface ColorAsignatura {
  fondo: string;  // fondo suave de la celda
  borde: string;  // franja de la izquierda
  texto: string;  // color del nombre de la materia
}

const PALETA: Record<string, ColorAsignatura> = {
  azul:     { fondo: '#eef4ff', borde: '#2563eb', texto: '#1e3a8a' },
  rosa:     { fondo: '#fdf0f6', borde: '#db2777', texto: '#831843' },
  morado:   { fondo: '#f5f0ff', borde: '#7c3aed', texto: '#4c1d95' },
  verde:    { fondo: '#edf8f1', borde: '#16a34a', texto: '#14532d' },
  naranja:  { fondo: '#fff4eb', borde: '#ea580c', texto: '#7c2d12' },
  ambar:    { fondo: '#fff8e6', borde: '#d97706', texto: '#78350f' },
  turquesa: { fondo: '#ecfaf8', borde: '#0d9488', texto: '#134e4a' },
  rojo:     { fondo: '#fdf0f0', borde: '#dc2626', texto: '#7f1d1d' },
  cian:     { fondo: '#ecf9fd', borde: '#0891b2', texto: '#164e63' },
  indigo:   { fondo: '#f0f1ff', borde: '#4f46e5', texto: '#312e81' },
  lima:     { fondo: '#f4f9e8', borde: '#65a30d', texto: '#365314' },
  cafe:     { fondo: '#f8f2ec', borde: '#a16207', texto: '#713f12' },
  fucsia:   { fondo: '#fdf2fb', borde: '#c026d3', texto: '#701a75' },
  gris:     { fondo: '#f3f4f6', borde: '#64748b', texto: '#1e293b' }
};

// El orden importa: "Ciencias Sociales" debe caer en sociales, no en ciencias
const REGLAS: [RegExp, string][] = [
  [/matemat/, 'azul'],
  [/lengua|literat/, 'rosa'],
  [/histor|social/, 'naranja'],
  [/cienc|natural/, 'morado'],
  [/ingles/, 'verde'],
  [/filosof/, 'ambar'],
  [/fisica|deport/, 'turquesa'],
  [/artist|cultural|arte|music/, 'rojo'],
  [/quimic/, 'cian'],
  [/robot|comput|informat|tecnolog/, 'indigo'],
  [/biolog/, 'lima'],
  [/emprend|gestion/, 'cafe'],
  [/chino|mandarin/, 'fucsia'],
  [/valores|acompan|tutor|refuerzo/, 'gris']
];

const ORDEN = Object.keys(PALETA);
const cache = new Map<string, ColorAsignatura>();

function normalizar(texto: string): string {
  return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function colorAsignatura(nombre: string): ColorAsignatura {
  const clave = normalizar(nombre);
  if (cache.has(clave)) return cache.get(clave)!;

  const regla = REGLAS.find(([re]) => re.test(clave));
  let color: ColorAsignatura;

  if (regla) {
    color = PALETA[regla[1]];
  } else {
    // Materia no conocida: siempre el mismo color para el mismo nombre
    let hash = 0;
    for (const ch of clave) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    color = PALETA[ORDEN[hash % ORDEN.length]];
  }

  cache.set(clave, color);
  return color;
}

export function hexARgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexAArgb(hex: string): string {
  return 'FF' + hex.replace('#', '').toUpperCase();
}