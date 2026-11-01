import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { BarChart3, CalendarRange, Globe, List, Menu, RotateCcw } from 'lucide-react'
import { negocio } from '../config/negocio'
import { capital, deClave, diaMes, fechaLarga, hoyClave, pct, pesos, sumarDias } from '../lib/formato'
import { actualizarReserva, estados, noches, origenes, reiniciar, useDatos, type Origen, type Reserva } from '../lib/datos'
import { Dialogo } from '../lib/ui'
import { Barras } from './Barras'

type Ctx = { verReserva: (id: string) => void }
const usePanel = () => useOutletContext<Ctx>()

const menu = [
  { a: '/admin', texto: 'Ocupación', icono: CalendarRange, fin: true },
  { a: '/admin/reservas', texto: 'Reservas', icono: List },
  { a: '/admin/ingresos', texto: 'Ingresos y comisiones', icono: BarChart3 },
]

const tonoOrigen: Record<Origen, string> = { booking: 'origen-booking', airbnb: 'origen-airbnb', directo: 'origen-directo', whatsapp: 'origen-whatsapp' }

export function Layout() {
  const [abierto, setAbierto] = useState(false)
  const [reserva, setReserva] = useState<string | null>(null)
  const lugar = useLocation()
  useEffect(() => {
    document.title = `Panel · ${negocio.nombre}`
    setAbierto(false)
  }, [lugar.pathname])
  const ctx = useMemo<Ctx>(() => ({ verReserva: setReserva }), [])
  return (
    <div className="admin">
      <aside className={`lateral ${abierto ? 'lateral-abierta' : ''}`}>
        <div className="producto">
          <span className="producto-marca producto-marca-cerro" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#1f5c49" /><path d="M4 24 L12 12 L17 18 L21 13 L28 24 Z" fill="#f2f2ef" /></svg>
          </span>
          <span>
            <strong>{negocio.nombre}</strong>
            <small>{negocio.tipo} en {negocio.lugar}</small>
          </span>
        </div>
        <nav className="menu">
          {menu.map(({ a, texto, icono: I, fin }) => (
            <NavLink key={a} to={a} end={fin}>
              <I size={17} strokeWidth={1.8} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="lateral-pie">
          <NavLink to="/" className="menu-secundario"><Globe size={16} strokeWidth={1.8} aria-hidden="true" /> Ver la web del complejo</NavLink>
          <button className="menu-secundario" onClick={reiniciar}><RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" /> Reiniciar demo</button>
          <p className="hecho-con">Hecho con Reserva Directa · demo</p>
        </div>
      </aside>
      <header className="superior">
        <button className="btn-icono solo-telefono" onClick={() => setAbierto(!abierto)} aria-label="Menú"><Menu size={20} /></button>
        <p className="superior-texto">{capital(fechaLarga(hoyClave()))}</p>
        <Link to="/" className="boton boton-chico">Reservar como huésped</Link>
      </header>
      <main className="hoja-admin">
        <Outlet context={ctx} />
      </main>
      <DetalleReserva id={reserva} cerrar={() => setReserva(null)} />
    </div>
  )
}

function DetalleReserva({ id, cerrar }: { id: string | null; cerrar: () => void }) {
  const e = useDatos()
  const r = e.reservas.find((x) => x.id === id)
  if (!r) return <Dialogo abierto={false} cerrar={cerrar} titulo="">{null}</Dialogo>
  const c = negocio.cabanas.find((x) => x.id === r.cabanaId)!
  const comision = Math.round(r.total * negocio.comision[r.origen])
  return (
    <Dialogo abierto cerrar={cerrar} titulo={`${c.nombre} · ${r.huesped.split(' · ')[0]}`}>
      <dl className="ficha">
        <div><dt>Llega</dt><dd>{capital(fechaLarga(r.desde))}</dd></div>
        <div><dt>Se va</dt><dd>{capital(fechaLarga(r.hasta))}</dd></div>
        <div><dt>Noches</dt><dd>{noches(r)}</dd></div>
        <div><dt>Personas</dt><dd>{r.personas}</dd></div>
        <div><dt>De dónde viene</dt><dd>{r.huesped.split(' · ')[1] ?? '—'}</dd></div>
        <div><dt>Reservó por</dt><dd>{origenes[r.origen]}</dd></div>
        <div><dt>Estado</dt><dd><span className={`estado estado-${r.estado}`}>{estados[r.estado]}</span></dd></div>
        <div><dt>Total</dt><dd>{pesos(r.total)}</dd></div>
        <div className="ficha-total"><dt>Comisión de la plataforma</dt><dd className={comision ? 'mal' : 'bien'}>{comision ? `−${pesos(comision)}` : 'Sin comisión'}</dd></div>
      </dl>
      <div className="acciones-fila">
        <a className="boton" href={`https://wa.me/54${r.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">Escribir por WhatsApp</a>
        {r.estado === 'consulta' && <button className="boton" onClick={() => actualizarReserva(r.id, { estado: 'señada' })}>Marcar seña recibida</button>}
        {r.estado === 'señada' && <button className="boton boton-primario" onClick={() => actualizarReserva(r.id, { estado: 'pagada' })}>Cobrar el saldo</button>}
        {r.estado !== 'cancelada' && r.desde > hoyClave() && <button className="boton boton-peligro" onClick={() => { actualizarReserva(r.id, { estado: 'cancelada' }); cerrar() }}>Cancelar</button>}
      </div>
    </Dialogo>
  )
}

// ——— Ocupación ———

export function Ocupacion() {
  const e = useDatos()
  const { verReserva } = usePanel()
  const hoy = hoyClave()
  const [inicio, setInicio] = useState(sumarDias(hoy, -3))
  const DIAS = 35
  const dias = Array.from({ length: DIAS }, (_, i) => sumarDias(inicio, i))
  const fin = sumarDias(inicio, DIAS)

  const k = useMemo(() => {
    const prox30 = Array.from({ length: 30 }, (_, i) => sumarDias(hoy, i))
    const ocupadas = prox30.reduce((s, d) => s + negocio.cabanas.filter((c) => e.reservas.some((r) => r.cabanaId === c.id && r.estado !== 'cancelada' && r.desde <= d && d < r.hasta)).length, 0)
    const llegan = e.reservas.filter((r) => r.estado !== 'cancelada' && r.desde >= hoy && r.desde <= sumarDias(hoy, 7)).sort((a, b) => a.desde.localeCompare(b.desde))
    const sinSeña = e.reservas.filter((r) => r.estado === 'consulta' && r.desde >= hoy)
    const enero = e.reservas.filter((r) => r.estado !== 'cancelada' && r.desde.slice(5, 7) === '01')
    const nochesEnero = enero.reduce((s, r) => s + noches(r), 0)
    return { ocupacion: ocupadas / (30 * negocio.cabanas.length), llegan, sinSeña, enero: nochesEnero / (31 * negocio.cabanas.length) }
  }, [e, hoy])

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Ocupación</h1>
          <p>Del {diaMes(inicio)} al {diaMes(sumarDias(fin, -1))} · tocá una reserva para ver el detalle</p>
        </div>
        <div className="segmentos">
          <button onClick={() => setInicio(sumarDias(inicio, -14))} aria-label="Antes">←</button>
          <button className={inicio === sumarDias(hoy, -3) ? 'activa' : ''} onClick={() => setInicio(sumarDias(hoy, -3))}>Hoy</button>
          <button onClick={() => setInicio(sumarDias(inicio, 14))} aria-label="Después">→</button>
          <button onClick={() => setInicio(`${Number(hoy.slice(0, 4)) + (hoy.slice(5, 7) === '01' ? 0 : 1)}-01-01`)}>Enero</button>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Próximos 30 días</span><strong>{pct(k.ocupacion)}</strong><small>de las noches ya reservadas</small></div>
        <div className="kpi"><span>Enero</span><strong>{pct(k.enero)}</strong><small>ocupado, temporada alta</small></div>
        <div className="kpi"><span>Llegan esta semana</span><strong>{k.llegan.length}</strong><small>{k.llegan[0] ? `la próxima: ${diaMes(k.llegan[0].desde)}, ${negocio.cabanas.find((c) => c.id === k.llegan[0].cabanaId)!.nombre}` : 'nadie por ahora'}</small></div>
        <div className="kpi"><span>Falta la seña</span><strong className={k.sinSeña.length ? 'mal' : ''}>{k.sinSeña.length}</strong><small>reservas por confirmar</small></div>
      </div>
      <section className="tarjeta">
        <div className="gantt" style={{ ['--dias' as string]: DIAS }}>
          <span />
          {dias.map((d) => {
            const dw = deClave(d).getDay()
            return (
              <span key={d} className={`gantt-dia ${dw === 0 || dw === 6 ? 'finde' : ''} ${d === hoy ? 'hoy' : ''}`}>
                <small>{['D', 'L', 'M', 'M', 'J', 'V', 'S'][dw]}</small>{Number(d.slice(8))}
              </span>
            )
          })}
          {negocio.cabanas.map((c) => {
            const suyas = e.reservas.filter((r) => r.cabanaId === c.id && r.estado !== 'cancelada' && r.hasta > inicio && r.desde < fin)
            return (
              <div className="gantt-fila" key={c.id}>
                <span className="gantt-cabana">{c.nombre}<small>{c.personas} personas</small></span>
                <div className="gantt-pista">
                  {dias.map((d) => {
                    const dw = deClave(d).getDay()
                    return <span key={d} className={`gantt-fondo ${dw === 0 || dw === 6 ? 'finde' : ''}`} />
                  })}
                  {suyas.map((r) => {
                    const a = Math.max(0, (deClave(r.desde).getTime() - deClave(inicio).getTime()) / 86400000)
                    const b = Math.min(DIAS, (deClave(r.hasta).getTime() - deClave(inicio).getTime()) / 86400000)
                    return (
                      <button
                        key={r.id}
                        className={`gantt-reserva ${tonoOrigen[r.origen]} ${r.estado === 'consulta' ? 'sin-seña' : ''}`}
                        style={{ left: `calc(${((a === 0 ? 0 : a + 0.5) / DIAS) * 100}% + 1px)`, width: `calc(${((b + 0.4 - (a === 0 ? 0 : a + 0.5)) / DIAS) * 100}% - 2px)` }}
                        onClick={() => verReserva(r.id)}
                        title={`${r.huesped} · ${origenes[r.origen]}`}
                      >
                        {r.huesped.split(' · ')[0]}
                      </button>
                    )
                  })}
                  {hoy >= inicio && hoy < fin && <span className="gantt-hoy" style={{ left: `${(((deClave(hoy).getTime() - deClave(inicio).getTime()) / 86400000 + 0.5) / DIAS) * 100}%` }} />}
                </div>
              </div>
            )
          })}
        </div>
        <ul className="leyenda">
          <li><span className="muestra origen-directo" /> Web propia</li>
          <li><span className="muestra origen-whatsapp" /> WhatsApp</li>
          <li><span className="muestra origen-booking" /> Booking</li>
          <li><span className="muestra origen-airbnb" /> Airbnb</li>
          <li><span className="muestra sin-seña-muestra" /> Falta la seña</li>
        </ul>
      </section>
      <div className="grilla-2">
        {(['Llegan', 'Se van'] as const).map((t) => {
          const lista = e.reservas
            .filter((r) => r.estado !== 'cancelada' && (t === 'Llegan' ? r.desde : r.hasta) >= hoy && (t === 'Llegan' ? r.desde : r.hasta) <= sumarDias(hoy, 7))
            .sort((a, b) => (t === 'Llegan' ? a.desde.localeCompare(b.desde) : a.hasta.localeCompare(b.hasta)))
          return (
            <section className="tarjeta" key={t}>
              <div className="tarjeta-cabeza"><h2>{t} esta semana</h2><span className="tenue">{lista.length}</span></div>
              {lista.length === 0 && <p className="vacio">Nadie en los próximos 7 días.</p>}
              <ul className="lista">
                {lista.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <button onClick={() => verReserva(r.id)}>
                      <span className="lista-hora">{diaMes(t === 'Llegan' ? r.desde : r.hasta)}</span>
                      <span className="lista-texto">{r.huesped.split(' · ')[0]}<small>{negocio.cabanas.find((c) => c.id === r.cabanaId)!.nombre} · {noches(r)} noches · {origenes[r.origen]}</small></span>
                      <span className={`estado estado-${r.estado}`}>{estados[r.estado]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ——— Reservas ———

export function Reservas() {
  const e = useDatos()
  const { verReserva } = usePanel()
  const hoy = hoyClave()
  const [filtro, setFiltro] = useState<'proximas' | 'sin-seña' | 'pasadas'>('proximas')
  const lista = e.reservas
    .filter((r) => r.estado !== 'cancelada')
    .filter((r) => (filtro === 'proximas' ? r.hasta > hoy : filtro === 'sin-seña' ? r.estado === 'consulta' && r.desde >= hoy : r.hasta <= hoy))
    .sort((a, b) => (filtro === 'pasadas' ? b.desde.localeCompare(a.desde) : a.desde.localeCompare(b.desde)))
  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Reservas</h1>
          <p>{lista.length} reservas</p>
        </div>
      </div>
      <div className="pestanas-admin" role="tablist">
        {([['proximas', 'Próximas'], ['sin-seña', 'Falta la seña'], ['pasadas', 'Pasadas']] as const).map(([id, t]) => (
          <button key={id} role="tab" aria-selected={filtro === id} className={filtro === id ? 'activa' : ''} onClick={() => setFiltro(id)}>{t}</button>
        ))}
      </div>
      <table className="tabla">
        <thead><tr><th>Huésped</th><th>Cabaña</th><th>Fechas</th><th className="num">Noches</th><th>Origen</th><th>Estado</th><th className="num">Total</th></tr></thead>
        <tbody>
          {lista.slice(0, 60).map((r: Reserva) => (
            <tr key={r.id} className="fila-clic" onClick={() => verReserva(r.id)}>
              <td><strong>{r.huesped.split(' · ')[0]}</strong><small>{r.huesped.split(' · ')[1]} · {r.telefono}</small></td>
              <td>{negocio.cabanas.find((c) => c.id === r.cabanaId)!.nombre}</td>
              <td>{diaMes(r.desde)} al {diaMes(r.hasta)}</td>
              <td className="num">{noches(r)}</td>
              <td><span className={`etiqueta ${tonoOrigen[r.origen]}`}>{origenes[r.origen]}</span></td>
              <td><span className={`estado estado-${r.estado}`}>{estados[r.estado]}</span></td>
              <td className="num">{pesos(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ——— Ingresos y comisiones ———

export function Ingresos() {
  const e = useDatos()
  const hoy = hoyClave()
  const r = useMemo(() => {
    const validas = e.reservas.filter((x) => x.estado !== 'cancelada')
    const porMes = Array.from({ length: 6 }, (_, i) => {
      const base = deClave(hoy)
      const m = new Date(base.getFullYear(), base.getMonth() - 1 + i, 1)
      const clave = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
      const suyas = validas.filter((x) => x.desde.startsWith(clave))
      return { etiqueta: new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(m).replace('.', ''), valor: suyas.reduce((s, x) => s + x.total, 0), detalle: `${capital(new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(m))} · ${suyas.length} reservas`, futuro: clave > hoy.slice(0, 7) }
    })
    const temporada = validas.filter((x) => x.desde >= sumarDias(hoy, -60))
    const total = temporada.reduce((s, x) => s + x.total, 0)
    const comisiones = temporada.reduce((s, x) => s + Math.round(x.total * negocio.comision[x.origen]), 0)
    const porOrigen = (Object.keys(origenes) as Origen[]).map((o) => {
      const suyas = temporada.filter((x) => x.origen === o)
      const monto = suyas.reduce((s, x) => s + x.total, 0)
      return { o, n: suyas.length, monto, comision: Math.round(monto * negocio.comision[o]) }
    })
    const directas = porOrigen.filter((x) => x.o === 'directo' || x.o === 'whatsapp').reduce((s, x) => s + x.monto, 0)
    return { porMes, total, comisiones, porOrigen, ahorro: Math.round(directas * negocio.comision.booking) }
  }, [e, hoy])
  const max = Math.max(...r.porOrigen.map((x) => x.monto))

  return (
    <div className="pantalla">
      <div className="titulo-fila">
        <div>
          <h1>Ingresos y comisiones</h1>
          <p>Reservas desde hace 60 días hasta la temporada de verano</p>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Reservado</span><strong>{pesos(r.total)}</strong><small>{r.porOrigen.reduce((s, x) => s + x.n, 0)} reservas</small></div>
        <div className="kpi"><span>Pagado en comisiones</span><strong className="mal">{pesos(r.comisiones)}</strong><small>{pct(r.comisiones / r.total)} de lo reservado, a Booking y Airbnb</small></div>
        <div className="kpi"><span>Ahorrado con reservas directas</span><strong className="bien">{pesos(r.ahorro)}</strong><small>lo que se hubiera ido en comisión de Booking</small></div>
        <div className="kpi"><span>Directas</span><strong>{pct((r.porOrigen[2].n + r.porOrigen[3].n) / Math.max(1, r.porOrigen.reduce((s, x) => s + x.n, 0)))}</strong><small>por la web propia o WhatsApp</small></div>
      </div>
      <section className="tarjeta">
        <div className="tarjeta-cabeza"><h2>Reservado por mes de llegada</h2><p className="ayuda"><span className="muestra muestra-ahora muestra-ancha" /> Meses que vienen</p></div>
        <Barras datos={r.porMes} alto={220} resaltar={(i) => r.porMes[i].futuro} />
      </section>
      <section className="tarjeta">
        <div className="tarjeta-cabeza"><h2>De dónde vienen las reservas</h2></div>
        <table className="tabla">
          <thead><tr><th>Canal</th><th className="num">Reservas</th><th /><th className="num">Monto</th><th className="num">Comisión</th></tr></thead>
          <tbody>
            {r.porOrigen.map((x) => (
              <tr key={x.o}>
                <td><span className={`etiqueta ${tonoOrigen[x.o]}`}>{origenes[x.o]}</span></td>
                <td className="num">{x.n}</td>
                <td style={{ width: '30%' }}><span className="ranking-barra"><span style={{ width: `${(x.monto / max) * 100}%` }} /></span></td>
                <td className="num">{pesos(x.monto)}</td>
                <td className={`num ${x.comision ? 'mal' : ''}`}>{x.comision ? `−${pesos(x.comision)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ayuda">Cada huésped que vuelve y reserva directo le ahorra al complejo el 15%. Con 10% de descuento para él, ganan los dos.</p>
      </section>
    </div>
  )
}
