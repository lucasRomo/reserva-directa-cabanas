import { useEffect, useRef, type ReactNode } from 'react'

/** Marca la sección como vista al entrar en pantalla, para la animación de entrada. */
export function useRevelar<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Se mide con el scroll (no con IntersectionObserver) para que funcione también en pestañas en segundo plano
    const mirar = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.classList.add('visto')
        quitar()
      }
    }
    const quitar = () => {
      window.removeEventListener('scroll', mirar)
      window.removeEventListener('resize', mirar)
    }
    window.addEventListener('scroll', mirar, { passive: true })
    window.addEventListener('resize', mirar)
    mirar()
    return quitar
  }, [])
  return ref
}

/** Curvas de nivel, como en la carta topográfica de Los Gigantes. Siempre las mismas para cada semilla. */
export function Curvas({ semilla = 1, cerros = 3, niveles = 9, className = '' }: { semilla?: number; cerros?: number; niveles?: number; className?: string }) {
  let a = semilla * 9301
  const azar = () => ((a = (a * 9301 + 49297) % 233280) / 233280)
  const caminos: string[] = []
  for (let c = 0; c < cerros; c++) {
    const cx = 120 + azar() * 760
    const cy = 80 + azar() * 340
    const f = [azar() * 6, azar() * 6, azar() * 6]
    const escala = 0.7 + azar() * 0.6
    for (let n = 1; n <= niveles; n++) {
      const r = n * 34 * escala
      const pts: string[] = []
      for (let k = 0; k <= 72; k++) {
        const t = (k / 72) * Math.PI * 2
        const d = r * (1 + 0.16 * Math.sin(2 * t + f[0]) + 0.09 * Math.sin(3 * t + f[1] + n * 0.2) + 0.05 * Math.sin(5 * t + f[2]))
        pts.push(`${(cx + Math.cos(t) * d * 1.35).toFixed(1)},${(cy + Math.sin(t) * d * 0.8).toFixed(1)}`)
      }
      caminos.push(`M${pts.join('L')}Z`)
    }
  }
  return (
    <svg className={`curvas ${className}`} viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {caminos.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

/** El cartel de madera de la tranquera: nombre, rubro y el kilómetro del camino. */
export function Cartel({ chico = false }: { chico?: boolean }) {
  return (
    <span className={`cartel ${chico ? 'cartel-chico' : ''}`}>
      <span className="cartel-nombre">Las Lajas</span>
      <span className="cartel-km">km 4 <span aria-hidden="true">→</span></span>
    </span>
  )
}

export function Dialogo({
  abierto,
  cerrar,
  titulo,
  children,
  ancho = 480,
}: {
  abierto: boolean
  cerrar: () => void
  titulo: string
  children: ReactNode
  ancho?: number
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])
  return (
    <dialog
      ref={ref}
      className="dialogo"
      style={{ width: `min(${ancho}px, calc(100vw - 24px))` }}
      onClose={cerrar}
      onClick={(e) => e.target === ref.current && cerrar()}
    >
      {abierto && (
        <div className="dialogo-cuerpo">
          <header className="dialogo-cabeza">
            <h2>{titulo}</h2>
            <button type="button" className="btn-icono" onClick={cerrar} aria-label="Cerrar">
              ×
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
