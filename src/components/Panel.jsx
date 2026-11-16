import Glyph from './Glyph.jsx'
import { AREA, FAMILY, MAKE, SUBS, areaOf, placeLabel } from '../data/taxonomy.js'

export default function Panel({ pasta, siblings, groupLabel, onClose, onPick, onJump }) {
  const fam = FAMILY[pasta.family]
  const area = AREA[areaOf(pasta)]
  const make = MAKE[pasta.make]
  const i = siblings.findIndex((s) => s.id === pasta.id)
  const prev = siblings[(i - 1 + siblings.length) % siblings.length]
  const next = siblings[(i + 1) % siblings.length]
  const others = siblings.filter((s) => s.id !== pasta.id)

  return (
    <aside className="panel" aria-label={`${pasta.name} details`} style={{ '--accent': fam.color }}>
      <button className="panel-close" onClick={onClose} aria-label="Close details">
        ×
      </button>
      <div className="panel-scroll" key={pasta.id}>
        <div className="plate">
          <Glyph pasta={pasta} size={190} />
        </div>
        <h2>{pasta.name}</h2>
        <p className="pron">
          {pasta.pron && <span>{pasta.pron}</span>}
          {pasta.meaning && <em>“{pasta.meaning}”</em>}
        </p>
        <p className="look">{pasta.look}</p>

        <dl className="facts">
          <div>
            <dt>Shape</dt>
            <dd>
              <button className="chip" style={{ '--c': fam.color }} onClick={() => onJump('shape', pasta.family, pasta.sub)}>
                {fam.label} <span>›</span> {SUBS[pasta.sub]}
              </button>
            </dd>
          </div>
          <div>
            <dt>Origin</dt>
            <dd>
              <button
                className="chip"
                style={{ '--c': area.color }}
                onClick={() => onJump('origin', area.id, pasta.region === 'world' ? 'c:' + pasta.country : 'r:' + pasta.region)}
              >
                {placeLabel(pasta)}
                {pasta.region !== 'world' && pasta.region !== 'italy' && (
                  <>
                    {' '}
                    <span>·</span> {area.label}
                  </>
                )}
              </button>
            </dd>
          </div>
          <div>
            <dt>Dough</dt>
            <dd>
              <button className="chip" style={{ '--c': make.color }} onClick={() => onJump('dough', pasta.make, pasta.make + ':' + pasta.family)}>
                <i className="swatch" style={{ background: make.fill }} />
                {make.short}
              </button>
            </dd>
          </div>
        </dl>

        <p className="fact">{pasta.fact}</p>

        {pasta.pairings?.length > 0 && (
          <section>
            <h3>Classic with</h3>
            <ul className="pairings">
              {pasta.pairings.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {pasta.aliases?.length > 0 && (
          <section>
            <h3>Also called</h3>
            <p className="aliases">{pasta.aliases.join(' · ')}</p>
          </section>
        )}

        {others.length > 0 && (
          <section>
            <h3>Neighbours in {groupLabel}</h3>
            <div className="neighbours">
              {others.map((s) => (
                <button key={s.id} onClick={() => onPick(s.id)} title={s.look}>
                  <Glyph pasta={s} size={34} />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
      {siblings.length > 1 && (
        <div className="panel-nav">
          <button onClick={() => onPick(prev.id)}>← {prev.name}</button>
          <button onClick={() => onPick(next.id)}>{next.name} →</button>
        </div>
      )}
    </aside>
  )
}
