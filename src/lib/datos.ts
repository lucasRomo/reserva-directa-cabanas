// Reservas de la demo: viven en el navegador (localStorage) y se regeneran cada día.
import { useSyncExternalStore } from 'react'
import { negocio, precioNoche, esAlta } from '../config/negocio'
import { deClave, hoyClave, sumarDias } from './formato'

export type Origen = 'booking' | 'airbnb' | 'directo' | 'whatsapp'
export const origenes: Record<Origen, string> = { booking: 'Booking', airbnb: 'Airbnb', directo: 'Web propia', whatsapp: 'WhatsApp' }

export type EstadoReserva = 'consulta' | 'señada' | 'pagada' | 'cancelada'
export const estados: Record<EstadoReserva, string> = { consulta: 'Falta la seña', señada: 'Señada', pagada: 'Pagada', cancelada: 'Cancelada' }

export type Reserva = {
  id: string
  cabanaId: string
  desde: string // noche de llegada
  hasta: string // día de salida
  huesped: string
  telefono: string
  personas: number
  origen: Origen
  total: number
  estado: EstadoReserva
  creada: string
}

export type Estado = { version: number; generado: string; reservas: Reserva[] }

const VERSION = 1
const CLAVE = 'laslajas-demo'

function azar(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const nombres = ['Familia Rossi', 'Laura y Diego', 'Martín Paz', 'Familia Gómez', 'Cecilia Ortiz', 'Pablo y Anita', 'Familia Bianchi', 'Sofía Luna', 'Grupo de amigas', 'Javier Méndez', 'Familia Sosa', 'Marina y Fede', 'Lucas Herrera', 'Familia Acosta', 'Valeria Ruiz', 'Nico y Belu']
const ciudades = ['Rosario', 'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Río Cuarto']

export const noches = (r: Pick<Reserva, 'desde' | 'hasta'>) => Math.round((deClave(r.hasta).getTime() - deClave(r.desde).getTime()) / 86400000)

export function cotizar(cabanaId: string, desde: string, hasta: string) {
  const c = negocio.cabanas.find((x) => x.id === cabanaId)!
  let total = 0
  for (let d = desde; d < hasta; d = sumarDias(d, 1)) total += precioNoche(c, d)
  return total
}

function generar(): Estado {
  const hoy = hoyClave()
  const r = azar(Number(hoy.replace(/-/g, '')) + 99)
  const reservas: Reserva[] = []
  let n = 0
  for (const c of negocio.cabanas) {
    let d = sumarDias(hoy, -50 + Math.floor(r() * 4))
    const fin = sumarDias(hoy, 150)
    while (d < fin) {
      const alta = esAlta(d)
      const dow = deClave(d).getDay()
      // En baja se llenan los fines de semana; en alta casi todo
      const p = alta ? 0.86 : dow === 5 ? 0.6 : dow === 4 ? 0.25 : 0.08
      const lejos = Math.max(0, (deClave(d).getTime() - deClave(hoy).getTime()) / 86400000)
      const llenado = alta ? 1 - lejos / 400 : 1 - lejos / 80
      if (r() < p * Math.max(0.15, llenado)) {
        const largo = alta ? 3 + Math.floor(r() * 5) : dow === 5 ? 2 + (r() < 0.3 ? 1 : 0) : 2 + Math.floor(r() * 3)
        const hasta = sumarDias(d, largo)
        const origen: Origen = r() < 0.44 ? 'booking' : r() < 0.55 ? 'directo' : r() < 0.6 ? 'airbnb' : 'whatsapp'
        let total = cotizar(c.id, d, hasta)
        if (origen === 'directo' || origen === 'whatsapp') total = Math.round((total * (1 - negocio.descuentoDirecto)) / 1000) * 1000
        const pasada = hasta <= hoy
        reservas.push({
          id: `r${++n}`, cabanaId: c.id, desde: d, hasta,
          huesped: `${nombres[Math.floor(r() * nombres.length)]} · ${ciudades[Math.floor(r() * ciudades.length)]}`,
          telefono: `${['341', '11', '351', '342'][Math.floor(r() * 4)]} ${Math.floor(400 + r() * 500)}-${String(Math.floor(r() * 10000)).padStart(4, '0')}`,
          personas: Math.max(1, c.personas - Math.floor(r() * 2)),
          origen, total,
          estado: pasada || d <= hoy ? 'pagada' : origen === 'booking' || origen === 'airbnb' ? 'pagada' : r() < 0.2 ? 'consulta' : 'señada',
          creada: sumarDias(d, -Math.floor(5 + r() * 60)),
        })
        d = sumarDias(hasta, Math.floor(r() * 2))
      } else d = sumarDias(d, 1)
    }
  }
  return { version: VERSION, generado: hoy, reservas }
}

function cargar(): Estado {
  try {
    const e = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Estado | null
    if (e && e.version === VERSION && e.generado === hoyClave()) return e
  } catch {
    /* sin almacenamiento */
  }
  return generar()
}

let estado = cargar()
const oyentes = new Set<() => void>()
function guardar(e: Estado) {
  estado = e
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e))
  } catch {
    /* modo privado */
  }
  oyentes.forEach((f) => f())
}
const suscribir = (f: () => void) => {
  oyentes.add(f)
  return () => {
    oyentes.delete(f)
  }
}
export const useDatos = () => useSyncExternalStore(suscribir, () => estado)
export const reiniciar = () => guardar(generar())

export const ocupado = (e: Estado, cabanaId: string, noche: string) =>
  e.reservas.some((x) => x.cabanaId === cabanaId && x.estado !== 'cancelada' && x.desde <= noche && noche < x.hasta)

export function reservar(d: Omit<Reserva, 'id' | 'estado' | 'creada' | 'total' | 'origen'> & { señada: boolean }) {
  const { señada, ...resto } = d
  const total = Math.round((cotizar(d.cabanaId, d.desde, d.hasta) * (1 - negocio.descuentoDirecto)) / 1000) * 1000
  const nueva: Reserva = { ...resto, id: `r${Date.now()}`, origen: 'directo', total, estado: señada ? 'señada' : 'consulta', creada: hoyClave() }
  guardar({ ...estado, reservas: [...estado.reservas, nueva] })
  return nueva
}
export const actualizarReserva = (id: string, c: Partial<Reserva>) =>
  guardar({ ...estado, reservas: estado.reservas.map((x) => (x.id === id ? { ...x, ...c } : x)) })
