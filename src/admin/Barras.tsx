import { useState } from 'react'
import { pesos } from '../lib/formato'

/** Gráfico de barras simple: una serie, guías a la mitad y al máximo, detalle al pasar el mouse. */
export function Barras({
  datos,
  alto = 200,
  formato = pesos,
  resaltar,
}: {
  datos: { etiqueta: string; valor: number; detalle?: string }[]
  alto?: number
  formato?: (n: number) => string
  resaltar?: (i: number) => boolean
}) {
  const max = Math.max(1, ...datos.map((d) => d.valor))
  const [sobre, setSobre] = useState<number | null>(null)
  return (
    <div className="barras" style={{ height: alto }} onMouseLeave={() => setSobre(null)}>
      <div className="barras-guias" aria-hidden="true">
        {[0.5, 1].map((f) => (
          <span key={f} style={{ bottom: `${f * 100}%` }}>{formato(Math.round(max * f))}</span>
        ))}
      </div>
      <div className="barras-columnas" role="list">
        {datos.map((d, i) => (
          <div
            key={i}
            role="listitem"
            className={`barra ${resaltar?.(i) ? 'barra-resaltada' : ''} ${sobre === i ? 'barra-sobre' : ''}`}
            onMouseEnter={() => setSobre(i)}
            aria-label={`${d.detalle ?? d.etiqueta}: ${formato(d.valor)}`}
          >
            <span className="barra-relleno" style={{ height: `${(d.valor / max) * 100}%` }} />
            {sobre === i && (
              <span className="barra-nota">
                <strong>{formato(d.valor)}</strong>
                {d.detalle ?? d.etiqueta}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
