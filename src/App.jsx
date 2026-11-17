import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Atlas } from './lib/atlas.js'
import { PASTA, PASTAS } from './data/index.js'
import { LENS, LENSES, MAKES } from './data/taxonomy.js'
import Panel from './components/Panel.jsx'
import Search from './components/Search.jsx'

const PANEL_W = 440
// keep in sync with the phone media queries in index.css
const LANDSCAPE_PHONE = '(orientation: landscape) and (max-height: 500px)'
const isPhone = () => window.matchMedia(`(max-width: 820px), ${LANDSCAPE_PHONE}`).matches
const isLandscapePhone = () => window.matchMedia(LANDSCAPE_PHONE).matches
// how much of the canvas the overlays cover, so the camera can frame around them
const insetFor = (mode) => {
  if (!isPhone()) return { right: mode === 'panel' ? PANEL_W : 0 }
  // landscape phones: panel and tour dock to the right, below the bar
  if (isLandscapePhone()) return { top: 60, right: mode ? Math.min(380, Math.round(window.innerWidth * 0.5)) + 8 : 0, bottom: mode ? 0 : 50 }
  return { top: 104, bottom: mode === 'panel' ? Math.round(window.innerHeight * 0.56) : mode === 'tour' ? Math.min(250, Math.round(window.innerHeight * 0.6)) : 50 }
}

function readHash() {
  const [lens, id] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { lens: LENS[lens] ? lens : 'shape', id: PASTA[id] ? id : null }
}

export default function App() {
  const initial = useMemo(readHash, [])
  const canvasRef = useRef(null)
  const atlasRef = useRef(null)
  const searchRef = useRef(null)
  const [lens, setLens] = useState(initial.lens)
  const [selected, setSelected] = useState(initial.id)
  const [hover, setHover] = useState(null)
  const [context, setContext] = useState(null)
  const [intro, setIntro] = useState(!initial.id)
  const [tour, setTour] = useState(null)
  const tourRef = useRef(null)
  const selectedRef = useRef(selected)
  tourRef.current = tour
  selectedRef.current = selected
  const [phone, setPhone] = useState(isPhone)
  const [showKey, setShowKey] = useState(false)
  const [, setReady] = useState(0)

  const stats = useMemo(() => {
    const countries = new Set(PASTAS.filter((p) => p.region === 'world').map((p) => p.country))
    const regions = new Set(PASTAS.filter((p) => p.region !== 'world' && p.region !== 'italy').map((p) => p.region))
    return { total: PASTAS.length, countries: countries.size, regions: regions.size }
  }, [])

  // ----- engine -----
  useEffect(() => {
    const atlas = new Atlas(canvasRef.current, PASTAS, LENSES, {
      onSelect: (id) => {
        setSelected(id)
        if (id) setTour(null)
      },
      onHover: setHover,
      onContext: setContext,
    })
    atlasRef.current = atlas
    setReady((n) => n + 1)
    if (initial.lens !== 'shape') {
      atlas.layout = atlas.getLayout(initial.lens)
      atlas.resize()
      atlas.view = atlas._fitView(atlas.layout.bounds)
    }
    atlas.setInset(insetFor(null))
    atlas.view = atlas._fitView(atlas.layout.bounds)
    let lastW = canvasRef.current.clientWidth
    const ro = new ResizeObserver(() => {
      setPhone(isPhone())
      atlas.setInset(insetFor(selectedRef.current ? 'panel' : tourRef.current != null ? 'tour' : null))
      atlas.resize()
      // on rotation the overlays move, so re-centre whatever is being looked at
      const w = canvasRef.current.clientWidth
      if (w !== lastW) {
        lastW = w
        if (selectedRef.current) atlas.focusPasta(selectedRef.current, 0)
        else if (tourRef.current != null) goTourRef.current?.(tourRef.current)
      }
    })
    ro.observe(canvasRef.current)
    return () => {
      ro.disconnect()
      atlas.destroy()
    }
  }, [initial])

  // ----- selection / lens → camera -----
  const first = useRef(true)
  const previousLens = useRef(lens)
  useEffect(() => {
    const atlas = atlasRef.current
    atlas.setLens(lens)
    atlas.setSelected(selected)
    atlas.setInset(insetFor(selected ? 'panel' : tourRef.current != null ? 'tour' : null))
    if (selected) atlas.focusPasta(selected, first.current || (atlas.coarse && previousLens.current !== lens) ? 0 : 1100)
    previousLens.current = lens
    first.current = false
    const hash = `#/${lens}${selected ? '/' + selected : ''}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [lens, selected])

  useEffect(() => {
    const onHash = () => {
      const h = readHash()
      setLens(h.lens)
      setSelected(h.id)
      if (h.id) setIntro(false)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const changeLens = useCallback(
    (id) => {
      if (id === lens) return
      setTour(null)
      atlasRef.current.focusGroup = null
      setLens(id)
      if (!selected) {
        const a = atlasRef.current
        a.setLens(id)
        a.fitAll(a.coarse ? 0 : 1300)
      }
    },
    [lens, selected],
  )

  const jump = useCallback((lensId, groupId, subId) => {
    const a = atlasRef.current
    setTour(null)
    a.focusGroup = null
    setLens(lensId)
    setSelected(null)
    a.setLens(lensId)
    a.setInset(insetFor(null))
    const node = a.findGroup(lensId, groupId, subId)
    if (node) a.fitNode(node, 1400)
  }, [])

  const close = useCallback(() => {
    setSelected(null)
  }, [])

  const surprise = useCallback(() => {
    setTour(null)
    atlasRef.current.focusGroup = null
    let p
    do p = PASTAS[Math.floor(Math.random() * PASTAS.length)]
    while (p.id === selected)
    setSelected(p.id)
  }, [selected])

  // ----- tour -----
  const stops = atlasRef.current?.getLayout(lens).groups || []
  const goTour = useCallback(
    (i) => {
      const a = atlasRef.current
      const groups = a.getLayout(lens).groups
      if (i == null || i < 0 || i >= groups.length) {
        a.focusGroup = null
        setTour(null)
        a.setInset(insetFor(null))
        a.fitAll(1200)
        return
      }
      setSelected(null)
      a.setInset(insetFor('tour'))
      a.focusGroup = groups[i].id
      a.fitNode(groups[i], 1500)
      setTour(i)
    },
    [lens],
  )
  const goTourRef = useRef(goTour)
  goTourRef.current = goTour

  const begin = () => {
    setIntro(false)
    atlasRef.current.intro()
  }

  // ----- keyboard -----
  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName)
      const a = atlasRef.current
      if (intro) {
        if (e.key === 'Enter' || e.key === ' ') begin()
        return
      }
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (typing) return
      else if (e.key === 'Escape') {
        if (selected) close()
        else if (tour != null) goTour(null)
        else a.fitAll()
      } else if (e.key === '+' || e.key === '=') a.zoomBy(1.5)
      else if (e.key === '-') a.zoomBy(1 / 1.5)
      else if (e.key === '0') a.fitAll()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const d = e.key === 'ArrowRight' ? 1 : -1
        if (tour != null) goTour(tour + d)
        else if (selected) {
          const sib = a.layout.leaf[selected].sub.leaves
          const i = sib.findIndex((s) => s.id === selected)
          setSelected(sib[(i + d + sib.length) % sib.length].id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pasta = selected ? PASTA[selected] : null
  const leaf = pasta && atlasRef.current?.getLayout(lens).leaf[pasta.id]
  const stop = tour != null ? stops[tour] : null

  return (
    <div className={`app${pasta ? ' has-panel' : ''}${stop ? ' has-tour' : ''}`}>
      <canvas ref={canvasRef} className="map" aria-label="Zoomable map of pasta shapes. Use search to find a shape by name." />

      <header className="bar">
        <button className="brand" onClick={() => atlasRef.current.fitAll()} title="Back to the whole map">
          <span>The Atlas of</span> Pasta
        </button>
        <Search ref={searchRef} total={stats.total} compact={phone} onPick={(id) => { setTour(null); atlasRef.current.focusGroup = null; setSelected(id) }} />
        <nav className="lenses" aria-label="Arrange the map">
          <span>Arrange by</span>
          {LENSES.map((l) => (
            <button key={l.id} className={l.id === lens ? 'on' : ''} aria-pressed={l.id === lens} onClick={() => changeLens(l.id)}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="actions">
          <button onClick={() => goTour(0)}>{phone ? 'Tour' : 'Guided tour'}</button>
          <button onClick={surprise}>{phone ? 'Surprise' : 'Surprise me'}</button>
        </div>
      </header>

      {!intro && !stop && (
        <div className="crumb" aria-live="polite">
          {context ? (
            <>
              <i style={{ background: context.group.color }} />
              {context.group.label}
              {context.sub && (
                <>
                  <span>›</span>
                  {context.sub.label}
                </>
              )}
            </>
          ) : (
            <em>The whole world of pasta, {LENS[lens].title}. Scroll to zoom, drag to wander, click anything.</em>
          )}
        </div>
      )}

      {hover && hover.pasta.id !== selected && (
        <div className="tip" style={{ left: hover.x, top: hover.y - hover.r - 10 }}>
          <b>{hover.pasta.name}</b>
          <span>{hover.pasta.look}</span>
        </div>
      )}

      {pasta && leaf && (
        <Panel
          pasta={pasta}
          siblings={leaf.sub.leaves}
          groupLabel={leaf.sub.label}
          onClose={close}
          onPick={setSelected}
          onJump={jump}
        />
      )}

      {stop && (
        <div className="tour" style={{ '--accent': stop.color }}>
          <div className="tour-step">
            Stop {tour + 1} of {stops.length}
          </div>
          <h2>{stop.label}</h2>
          <p>{stop.blurb}</p>
          <p className="tour-meta">
            {stop.count} shapes · {stop.subs.map((s) => s.label).slice(0, 6).join(', ')}
            {stop.subs.length > 6 ? '…' : ''}
          </p>
          <div className="tour-nav">
            <button onClick={() => goTour(null)}>End tour</button>
            <span />
            <button disabled={tour === 0} onClick={() => goTour(tour - 1)}>
              ← Back
            </button>
            <button className="primary" onClick={() => goTour(tour + 1 < stops.length ? tour + 1 : null)}>
              {tour + 1 < stops.length ? 'Next →' : 'Finish'}
            </button>
          </div>
        </div>
      )}

      <div className="corner">
        {showKey && (
          <div className="key">
            <h3>The colour of each pasta is its dough</h3>
            <ul>
              {MAKES.map((m) => (
                <li key={m.id}>
                  <i style={{ background: m.fill }} />
                  {m.label}
                </li>
              ))}
            </ul>
            <p>Ring and branch colour show the group in the current arrangement.</p>
          </div>
        )}
        <div className="zoom">
          <button onClick={() => setShowKey((v) => !v)} aria-pressed={showKey}>
            Key
          </button>
          <button className="zoom-step" onClick={() => atlasRef.current.zoomBy(1 / 1.6)} aria-label="Zoom out">
            −
          </button>
          <button onClick={() => atlasRef.current.fitAll()} aria-label="Show whole map" title="Whole map (0)">
            ◎
          </button>
          <button className="zoom-step" onClick={() => atlasRef.current.zoomBy(1.6)} aria-label="Zoom in">
            +
          </button>
        </div>
      </div>

      {intro && (
        <div className="intro">
          <div className="intro-card">
            <p className="kicker">An explorable map</p>
            <h1>
              The Atlas <span>of</span> Pasta
            </h1>
            <p className="lede">
              {stats.total} shapes, from spaghetti to su filindeu, drawn and sorted into one branching map. Start far out, where the great
              families are, then zoom in until every shape has a name, a hometown and a story.
            </p>
            <ul className="stats">
              <li>
                <b>{stats.total}</b> shapes
              </li>
              <li>
                <b>10</b> families
              </li>
              <li>
                <b>{stats.regions}</b> Italian regions
              </li>
              <li>
                <b>{stats.countries}</b> other countries
              </li>
            </ul>
            <button className="begin" onClick={begin} autoFocus>
              Begin the journey
            </button>
            <p className="hint">{phone ? 'Pinch to zoom · drag to wander · tap any shape' : 'Scroll to zoom · drag to wander · click any shape'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
