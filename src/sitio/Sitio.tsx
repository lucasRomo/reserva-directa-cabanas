import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { negocio, precioNoche, esAlta } from '../config/negocio'
import { capital, deClave, diaMes, fechaLarga, hoyClave, pesos, sumarDias } from '../lib/formato'
import { cotizar, noches, ocupado, proximoFinde, reservar, useDatos, type Reserva } from '../lib/datos'
import { Cartel } from '../lib/ui'

const PRODUCTO = 'Reserva Directa'
const meses = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const whatsapp = `https://wa.me/54${negocio.whatsapp.replace(/\D/g, '')}`
const desdeBaja = Math.min(...negocio.cabanas.map((c) => c.precio.baja))

function Portada() {
  return (
    <header className="portada" id="inicio">
      <img className="portada-foto" src="img/gigantes.jpg" alt="El macizo de Los Gigantes, en las Sierras Grandes de Córdoba" width={1920} height={1425} />
      <nav className="nav">
        <Cartel chico />
        <div className="nav-links">
          <a href="#cabanas">Cabañas</a>
          <a href="#reservar">Fechas libres</a>
          <a href="#cerca">Qué hay cerca</a>
          <a href="#llegar">Cómo llegar</a>
        </div>
        <a href="#reservar" className="btn btn-pasto">Reservar</a>
      </nav>
      <div className="portada-texto">
        <h1>Cabañas al pie de Los Gigantes</h1>
        <p>
          Cuatro cabañas en {negocio.lugar}, {negocio.region}. Reservando acá, directo con nosotros, pagás 10% menos que en Booking.
        </p>
        <div className="portada-acciones">
          <a href="#reservar" className="btn btn-pasto btn-grande">Ver fechas libres</a>
          <a href={whatsapp} className="btn btn-vidrio btn-grande" target="_blank" rel="noreferrer">Preguntar por WhatsApp</a>
        </div>
      </div>
      <dl className="portada-datos">
        <div><dt>Cabañas</dt><dd>4</dd></div>
        <div><dt>Para</dt><dd>2 a 6 personas</dd></div>
        <div><dt>La noche</dt><dd>desde {pesos(desdeBaja)}</dd></div>
        <div><dt>Leña</dt><dd>incluida abr–oct</dd></div>
      </dl>
    </header>
  )
}

function Cabanas({ elegir }: { elegir: (id: string) => void }) {
  const e = useDatos()
  const hoy = hoyClave()
  return (
    <section id="cabanas" className="cabanas">
      <div className="cabanas-intro">
        <h2>Las cuatro cabañas</h2>
        <p>
          Piedra laja de la zona y madera de la sierra. Todas con ropa de cama, vajilla, wifi y estacionamiento. Mascotas
          bienvenidas en Molle y Algarrobo.
        </p>
      </div>
      <ol className="cabanas-lista">
        {negocio.cabanas.map((c, i) => {
          const finde = proximoFinde(e, c.id)
          const esteFinde = finde && deClave(finde).getTime() - deClave(hoy).getTime() < 7 * 86400000
          return (
            <li key={c.id} className="cabana" style={{ ['--i' as string]: i }}>
              <div className="cabana-foto">
                <img src={`img/${c.foto}.jpg`} alt="" width={800} height={600} loading="lazy" />
                <span className={`cabana-finde ${esteFinde ? 'libre' : ''}`}>
                  {finde ? (esteFinde ? 'Libre este finde' : `Próximo finde libre: ${diaMes(finde)}`) : 'Fines de semana completos'}
                </span>
              </div>
              <div className="cabana-texto">
                <h3>{c.nombre}</h3>
                <p className="cabana-personas">Hasta {c.personas} personas</p>
                <p>{c.detalle}</p>
              </div>
              <div className="cabana-pie">
                <p className="cabana-precio">
                  <strong>{pesos(precioNoche(c, hoy))}</strong> la noche
                </p>
                <button className="btn btn-tinta" onClick={() => elegir(c.id)}>Ver fechas</button>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** El calendario: cada noche libre con su precio; se elige llegada y salida. */
function Reservar({ cabanaId, setCabana }: { cabanaId: string; setCabana: (id: string) => void }) {
  const e = useDatos()
  const hoy = hoyClave()
  const [desde, setDesde] = useState<string | null>(null)
  const [hasta, setHasta] = useState<string | null>(null)
  const [mes, setMes] = useState(0)
  const [nombre, setNombre] = useState('')
  const [tel, setTel] = useState('')
  const [pago, setPago] = useState<'nada' | 'pagando' | 'ok'>('nada')
  const [hecha, setHecha] = useState<Reserva | null>(null)
  const c = negocio.cabanas.find((x) => x.id === cabanaId)!

  useEffect(() => {
    setDesde(null)
    setHasta(null)
    setHecha(null)
  }, [cabanaId])

  const meses2 = useMemo(() => {
    const base = deClave(hoy)
    return [0, 1].map((k) => {
      const primero = new Date(base.getFullYear(), base.getMonth() + mes + k, 1)
      const dias: (string | null)[] = Array((primero.getDay() + 6) % 7).fill(null)
      const total = new Date(primero.getFullYear(), primero.getMonth() + 1, 0).getDate()
      for (let d = 1; d <= total; d++) dias.push(`${primero.getFullYear()}-${String(primero.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      return { titulo: meses.format(primero), dias }
    })
  }, [hoy, mes])

  const libreRango = (a: string, b: string) => {
    for (let d = a; d < b; d = sumarDias(d, 1)) if (ocupado(e, cabanaId, d)) return false
    return true
  }
  const tocar = (d: string) => {
    if (!desde || hasta || d <= desde) {
      setDesde(d)
      setHasta(null)
    } else if (libreRango(desde, d)) setHasta(d)
    else {
      setDesde(d)
      setHasta(null)
    }
  }

  const n = desde && hasta ? noches({ desde, hasta }) : 0
  const lista = desde && hasta ? cotizar(cabanaId, desde, hasta) : 0
  const directo = Math.round((lista * (1 - negocio.descuentoDirecto)) / 1000) * 1000
  const minimo = desde && esAlta(desde) ? 3 : 2

  function confirmar(ev: FormEvent) {
    ev.preventDefault()
    if (!desde || !hasta) return
    setHecha(reservar({ cabanaId, desde, hasta, huesped: nombre, telefono: tel, personas: c.personas, señada: pago === 'ok' }))
  }

  return (
    <section id="reservar" className="reservar">
      <div className="reservar-cabeza">
        <div>
          <h2>Fechas libres</h2>
          <p>Cada noche libre con su precio. Tocá la llegada y después el día que te vas.</p>
        </div>
        <div className="pestanas" role="tablist" aria-label="Cabaña">
          {negocio.cabanas.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === cabanaId} className={x.id === cabanaId ? 'activa' : ''} onClick={() => setCabana(x.id)}>
              {x.nombre}
              <small>{x.personas} pers.</small>
            </button>
          ))}
        </div>
      </div>
      <div className="reservar-cuerpo">
        <div className="calendario" data-ui>
          <div className="calendario-nav">
            <button onClick={() => setMes(Math.max(0, mes - 1))} disabled={mes === 0} aria-label="Meses anteriores">←</button>
            <button onClick={() => setMes(Math.min(5, mes + 1))} aria-label="Meses siguientes">→</button>
          </div>
          <div className="meses">
            {meses2.map((m) => (
              <div key={m.titulo} className="mes">
                <h3>{capital(m.titulo)}</h3>
                <div className="semana-nombres" aria-hidden="true">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x, i) => <span key={i}>{x}</span>)}</div>
                <div className="dias-mes">
                  {m.dias.map((d, i) => {
                    if (!d) return <span key={i} />
                    const pasado = d < hoy
                    const lleno = !pasado && ocupado(e, cabanaId, d)
                    const enRango = desde && (hasta ? d >= desde && d <= hasta : d === desde)
                    const borde = d === desde || d === hasta
                    const salidaPosible = desde && !hasta && d > desde && lleno && libreRango(desde, d)
                    return (
                      <button
                        key={d}
                        className={`dia ${lleno ? 'lleno' : ''} ${enRango ? 'elegido' : ''} ${borde ? 'borde' : ''} ${esAlta(d) ? 'alta' : ''}`}
                        disabled={pasado || (lleno && !salidaPosible)}
                        onClick={() => tocar(d)}
                        aria-label={`${fechaLarga(d)}${lleno ? ', ocupada' : `, ${pesos(precioNoche(c, d))}`}`}
                      >
                        <span>{Number(d.slice(8))}</span>
                        {!pasado && !lleno && <small>{Math.round(precioNoche(c, d) / 1000)}k</small>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <ul className="calendario-leyenda">
            <li><span className="muestra muestra-libre" /> Libre, precio por noche en miles</li>
            <li><span className="muestra muestra-alta" /> Temporada alta</li>
            <li><span className="muestra muestra-lleno" /> Ya reservada</li>
          </ul>
        </div>

        <aside className="cotizacion">
          {hecha ? (
            <div className="cotizacion-cuerpo">
              <p className="cotizacion-sello">Reserva hecha</p>
              <h3>¡Listo, {hecha.huesped.split(' ')[0]}!</h3>
              <p>{c.nombre}, del {fechaLarga(hecha.desde)} al {fechaLarga(hecha.hasta)}. {hecha.estado === 'señada' ? 'Seña recibida.' : 'Te escribimos por WhatsApp para la seña.'}</p>
              <p>Check-in desde las {negocio.checkin}. Te mandamos la ubicación exacta por WhatsApp.</p>
              <Link className="btn btn-pasto" to="/admin">Así lo ve el complejo</Link>
            </div>
          ) : !desde || !hasta ? (
            <div className="cotizacion-cuerpo">
              <img src={`img/${c.foto}.jpg`} alt="" width={800} height={600} />
              <h3>{c.nombre}</h3>
              <p>{c.detalle} Hasta {c.personas} personas.</p>
              <p className="tenue">
                {desde ? `Llegada: ${fechaLarga(desde)}. Ahora tocá el día que te vas.` : 'Elegí las fechas en el calendario.'} Mínimo {minimo} noches
                {minimo === 3 ? ' en temporada alta' : ''}.
              </p>
            </div>
          ) : (
            <form className="cotizacion-cuerpo" onSubmit={confirmar}>
              <h3>{n} {n === 1 ? 'noche' : 'noches'} en {c.nombre}</h3>
              <p className="tenue">{capital(fechaLarga(desde))} al {fechaLarga(hasta)}</p>
              <dl>
                <div><dt>En Booking</dt><dd className="tachado">{pesos(lista)}</dd></div>
                <div className="grande"><dt>Reservando acá</dt><dd>{pesos(directo)}</dd></div>
                <div><dt>Seña para confirmar</dt><dd>{pesos(Math.round(directo * negocio.seña))}</dd></div>
              </dl>
              {n < minimo && <p className="aviso">La estadía mínima en esas fechas es de {minimo} noches.</p>}
              <label><span className="oculto">Nombre</span><input required placeholder="Nombre y apellido" value={nombre} onChange={(ev) => setNombre(ev.target.value)} /></label>
              <label><span className="oculto">WhatsApp</span><input required placeholder="WhatsApp" inputMode="tel" value={tel} onChange={(ev) => setTel(ev.target.value)} /></label>
              {pago === 'ok' ? (
                <p className="pago-ok">Seña aprobada con Mercado Pago (simulado)</p>
              ) : (
                <button type="button" className="btn btn-mp" disabled={pago === 'pagando' || n < minimo} onClick={() => { setPago('pagando'); setTimeout(() => setPago('ok'), 1100) }}>
                  {pago === 'pagando' ? 'Procesando…' : `Señar ${pesos(Math.round(directo * negocio.seña))} con Mercado Pago`}
                </button>
              )}
              <button className="btn btn-pasto" disabled={n < minimo || !nombre || !tel}>{pago === 'ok' ? 'Confirmar reserva' : 'Pedir la reserva'}</button>
            </form>
          )}
        </aside>
      </div>
    </section>
  )
}

function Cerca() {
  const [sel, setSel] = useState(negocio.cerca[0].id)
  const x = negocio.cerca.find((c) => c.id === sel)!
  return (
    <section id="cerca" className="cerca">
      <div className="cerca-texto">
        <h2>Qué hay cerca</h2>
        <div className="cerca-pestanas" role="tablist">
          {negocio.cerca.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === sel} className={c.id === sel ? 'activa' : ''} onClick={() => setSel(c.id)}>
              <strong>{c.titulo}</strong>
              <span>{c.dato}</span>
            </button>
          ))}
        </div>
        <p className="cerca-detalle" key={sel}>{x.texto}</p>
        <a className="btn btn-pasto" href={whatsapp} target="_blank" rel="noreferrer">Preguntar por WhatsApp</a>
      </div>
      <figure className="cerca-foto">
        <img key={x.foto} src={`img/${x.foto}.jpg`} alt={x.titulo} width={1600} height={1200} loading="lazy" />
        <figcaption>{x.titulo}, {x.dato}</figcaption>
      </figure>
    </section>
  )
}

function Llegar() {
  return (
    <section id="llegar" className="llegar" aria-labelledby="llegar-titulo">
      <div className="llegar-cabeza">
        <h2 id="llegar-titulo">Cómo llegar</h2>
        <p>{negocio.direccion}, {negocio.lugar}. Ruta asfaltada hasta Tanti y después 4 km de ripio firme, se entra con cualquier auto.</p>
      </div>
      <ol className="ruta" aria-label="El camino desde Córdoba">
        {negocio.ruta.map((p) => (
          <li key={p.lugar} className={p.aca ? 'ruta-aca' : ''}>
            {p.tramo && <span className="ruta-tramo">{p.tramo}</span>}
            <span className="ruta-punto" aria-hidden="true" />
            <strong>{p.aca ? <Cartel /> : p.lugar}</strong>
          </li>
        ))}
      </ol>
      <div className="llegar-fila">
        <img src="img/punilla.jpg" alt="El valle de Punilla al anochecer, con las luces de los pueblos" width={1800} height={1134} loading="lazy" />
        <dl className="llegar-datos">
          <div><dt>Check-in</dt><dd>desde las {negocio.checkin}</dd></div>
          <div><dt>Check-out</dt><dd>hasta las {negocio.checkout}</dd></div>
          <div><dt>Seña</dt><dd>{Math.round(negocio.seña * 100)}% para confirmar</dd></div>
          <div><dt>WhatsApp</dt><dd><a href={whatsapp} target="_blank" rel="noreferrer">{negocio.whatsapp}</a></dd></div>
        </dl>
      </div>
    </section>
  )
}

export default function Sitio() {
  const [cabana, setCabana] = useState(negocio.cabanas[1].id)
  useEffect(() => {
    document.title = `${negocio.nombre}, ${negocio.tipo.toLowerCase()} en ${negocio.lugar}`
  }, [])
  return (
    <div className="sitio">
      <div className="barra-demo">
        <p>Demo de {PRODUCTO} para cabañas y complejos. El complejo es inventado y las reservas son de prueba.</p>
        <Link to="/admin">Ver el panel del complejo</Link>
      </div>
      <Portada />
      <main>
        <Cabanas elegir={(id) => { setCabana(id); document.getElementById('reservar')?.scrollIntoView() }} />
        <Reservar cabanaId={cabana} setCabana={setCabana} />
        <Cerca />
        <Llegar />
      </main>
      <footer className="pie">
        <div className="pie-filas">
          <p>{negocio.tipo} en {negocio.lugar}, {negocio.region}</p>
          <p>
            <a href={whatsapp}>WhatsApp {negocio.whatsapp}</a>{'  '}<a href={`https://instagram.com/${negocio.instagram}`}>Instagram</a>{'  '}
            <Link to="/admin">Panel del complejo</Link>
          </p>
        </div>
        <p className="pie-nombre">{negocio.nombre}</p>
        <p className="creditos">
          Fotos vía Wikimedia Commons: <a href="https://commons.wikimedia.org/wiki/File:LosGigantes.jpg">Los Gigantes</a> de Adrián Alberto Ruiz (CC BY 2.5);{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Sierras_de_C%C3%B3rdoba_cerca_de_Nono_2009-11.jpg">Sierras cerca de Nono</a> de *ASTOR* (CC BY-SA 2.0);{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Tanti_11.jpg">Tanti</a> de Jmmuguerza (CC BY-SA 4.0);{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Valle_De_Punilla_de_noche.jpg">Valle de Punilla</a> de Mikh Luna (CC BY-SA 4.0);{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Rio_San_Antonio.jpg">Río San Antonio</a> de Flores del Sur (CC BY-SA 4.0);{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Classic_wood-burning_stove_in_a_cozy_cabin_setting_near_nature.jpg">salamandra</a> de Shixart1985 (CC BY 2.0);{' '}
          <a href="https://commons.wikimedia.org/wiki/File:Daly_Creek_Patrol_Cabin-_wood_stove_and_table_(53069042146).jpg">interior de cabaña</a>, Yellowstone NPS (dominio público).
          Las fotos de interiores no son de este complejo.
        </p>
      </footer>
    </div>
  )
}
