// Todos los datos del complejo viven acá. "Las Lajas" es un complejo inventado para la demo.

export type Cabana = {
  id: string
  nombre: string
  personas: number
  detalle: string
  foto: string
  precio: { baja: number; alta: number } // por noche
}

export const negocio = {
  nombre: 'Las Lajas',
  tipo: 'Cabañas',
  lugar: 'Tanti',
  region: 'Valle de Punilla, Córdoba',
  direccion: 'Camino a Los Gigantes km 4',
  whatsapp: '3541 55-0193',
  instagram: 'laslajas.tanti',
  checkin: '14:00',
  checkout: '10:00',
  /** Porcentaje de seña para confirmar */
  seña: 0.3,
  /** Descuento por reservar directo, en vez de por una plataforma */
  descuentoDirecto: 0.1,
  /** Comisión que cobran las plataformas */
  comision: { booking: 0.15, airbnb: 0.15, directo: 0, whatsapp: 0 },

  cabanas: [
    { id: 'molle', nombre: 'Molle', personas: 2, detalle: 'Monoambiente con hogar a leña y deck mirando al cerro.', foto: 'salamandra', precio: { baja: 62000, alta: 95000 } },
    { id: 'algarrobo', nombre: 'Algarrobo', personas: 4, detalle: 'Dos ambientes, salamandra y parrilla propia.', foto: 'mesa', precio: { baja: 84000, alta: 128000 } },
    { id: 'quebracho', nombre: 'Quebracho', personas: 4, detalle: 'Dos dormitorios, galería y bajada propia al arroyo.', foto: 'rio', precio: { baja: 89000, alta: 136000 } },
    { id: 'casona', nombre: 'La Casona', personas: 6, detalle: 'Tres dormitorios, cocina grande, quincho y pileta compartida.', foto: 'panoramica', precio: { baja: 138000, alta: 210000 } },
  ] as Cabana[],

  cerca: [
    { id: 'rio', titulo: 'El arroyo', texto: 'A 300 metros, con ollas para bañarse de diciembre a marzo. Bajada propia desde Quebracho.', foto: 'rio', dato: '5 min caminando' },
    { id: 'cerros', titulo: 'Los Gigantes', texto: 'El macizo más alto de las Sierras Grandes, con trekking guiado de un día. Salimos desde la tranquera.', foto: 'gigantes', dato: '40 min en auto' },
    { id: 'pueblo', titulo: 'Tanti y Carlos Paz', texto: 'Almacén, panadería y feria los sábados en Tanti. Teatros, lago y restaurantes en Carlos Paz.', foto: 'punilla', dato: '10 y 25 min' },
  ],
}

/** Temporada alta: del 15 de diciembre al 1 de marzo, y julio. */
export function esAlta(dia: string) {
  const [, m, d] = dia.split('-').map(Number)
  return m === 1 || m === 2 || m === 7 || (m === 12 && d >= 15)
}

export const precioNoche = (c: Cabana, dia: string) => (esAlta(dia) ? c.precio.alta : c.precio.baja)
