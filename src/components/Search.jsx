import { forwardRef, useMemo, useState } from 'react'
import Glyph from './Glyph.jsx'
import { search } from '../data/index.js'
import { FAMILY, placeLabel } from '../data/taxonomy.js'

const Search = forwardRef(function Search({ onPick, total, compact }, ref) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const results = useMemo(() => search(q), [q])

  const pick = (r) => {
    if (!r) return
    onPick(r.p.id)
    setQ('')
    setOpen(false)
    // close the phone keyboard so the panel is visible, and hand keys back to the map
    document.activeElement?.blur()
  }

  return (
    <div className="search">
      <input
        ref={ref}
        type="search"
        enterKeyHint="search"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={q}
        placeholder={compact ? 'Search shapes…' : `Search ${total} shapes…  ( / )`}
        aria-label="Search pasta shapes"
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter') pick(results[active])
          else if (e.key === 'Escape') e.target.blur()
        }}
      />
      {open && q.trim() && (
        <ul className="results" role="listbox">
          {results.length === 0 && <li className="empty">No shape by that name in the atlas.</li>}
          {results.map((r, i) => (
            <li key={r.p.id} role="option" aria-selected={i === active}>
              <button className={i === active ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)} onMouseEnter={() => setActive(i)}>
                <Glyph pasta={r.p} size={30} />
                <span>
                  <b>{r.p.name}</b>
                  <small>
                    {r.alias ? `also “${r.alias}” · ` : ''}
                    {FAMILY[r.p.family].label} · {placeLabel(r.p)}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

export default Search
