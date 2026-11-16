import { drawGlyph } from './glyphs.js'
import { buildLayout, polar } from './layout.js'
import { MAKE } from '../data/taxonomy.js'

const PAPER = '#f7f0e1'
const INK = '#3a2917'
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif'
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const TAU = Math.PI * 2
const LEAF_R = 40

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

function wrapName(name) {
  if (name.length <= 15 || !name.includes(' ')) return [name]
  const words = name.split(' ')
  let best = null
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const score = Math.max(a.length, b.length)
    if (!best || score < best.score) best = { score, lines: [a, b] }
  }
  return best.lines
}

export class Atlas {
  constructor(canvas, pastas, lenses, handlers = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.pastas = pastas
    this.byId = Object.fromEntries(pastas.map((p) => [p.id, p]))
    this.lines = Object.fromEntries(pastas.map((p) => [p.id, wrapName(p.name)]))
    this.layouts = Object.fromEntries(lenses.map((l) => [l.id, buildLayout(pastas, l)]))
    this.layout = this.layouts[lenses[0].id]
    this.h = handlers
    this.view = { x: 0, y: 0, k: 0.2 }
    this.inset = { right: 0, top: 0, bottom: 0 }
    this.coarse = window.matchMedia?.('(pointer: coarse)').matches
    this.selected = null
    this.hover = null // {kind, node|id}
    this.focusGroup = null
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    this.pointers = new Map()
    this.resize()
    this._bind()
    this.view = this._fitView(this.layout.bounds)
    this.invalidate()
  }

  // ---------- geometry ----------
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = this.canvas.getBoundingClientRect()
    this.W = Math.max(320, r.width)
    this.H = Math.max(320, r.height)
    this.dpr = dpr
    this.canvas.width = Math.round(this.W * dpr)
    this.canvas.height = Math.round(this.H * dpr)
    this.kMin = this._fitView(this.layout.bounds, {}).k * 0.75
    this.invalidate()
  }
  toWorld(sx, sy) {
    const v = this.view
    return { x: (sx - this.W / 2) / v.k + v.x, y: (sy - this.H / 2) / v.k + v.y }
  }
  toScreen(wx, wy) {
    const v = this.view
    return { x: (wx - v.x) * v.k + this.W / 2, y: (wy - v.y) * v.k + this.H / 2 }
  }
  _fitView(b, inset = this.inset, pad = Math.min(70, this.W * 0.05), maxK = 1.25) {
    const { right = 0, top = 0, bottom = 0 } = inset || {}
    const w = this.W - right - pad * 2
    const h = this.H - top - bottom - pad * 2 - 40
    const k = Math.min(maxK, Math.max(0.02, Math.min(w / (b.x1 - b.x0 || 1), h / (b.y1 - b.y0 || 1))))
    return { x: (b.x0 + b.x1) / 2 + right / 2 / k, y: (b.y0 + b.y1) / 2 + ((bottom - top) / 2 - 14) / k, k }
  }
  leafPos(id) {
    const cur = this.layout.leaf[id]
    if (!this.morph) return cur
    const prev = this.morph.from.leaf[id]
    if (!prev) return cur
    const t = this.morph.e
    // interpolate in polar space so pastas swirl around the centre
    let da = cur.a - prev.a
    while (da > Math.PI) da -= TAU
    while (da < -Math.PI) da += TAU
    const p = polar(lerp(prev.r, cur.r, t), prev.a + da * t)
    return { ...cur, x: p.x, y: p.y }
  }

  // ---------- camera ----------
  flyTo(to, dur = 900) {
    to = { ...to, k: clamp(to.k, this.kMin, 3) }
    if (this.reduced || dur <= 0) {
      this.view = to
      this.anim = null
      this.invalidate()
      return
    }
    this._setHover(null)
    this.anim = { from: { ...this.view }, to, t0: performance.now(), dur }
    this.invalidate()
  }
  fitAll(dur = 1000) {
    this.flyTo(this._fitView(this.layout.bounds), dur)
  }
  fitNode(node, dur = 1000) {
    const b = node.bounds
    const m = 150
    this.flyTo(this._fitView({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m }), dur)
  }
  focusPasta(id, dur = 1000) {
    const l = this.layout.leaf[id]
    if (!l) return
    const k = clamp(Math.max(this.view.k, 1.15), 1.15, 1.7)
    const i = this.inset
    this.flyTo({ x: l.x + i.right / 2 / k, y: l.y + (i.bottom - i.top) / 2 / k, k }, dur)
  }
  zoomBy(f) {
    const k = clamp(this.view.k * f, this.kMin, 3)
    this.flyTo({ ...this.view, k }, 260)
  }
  intro() {
    const end = this._fitView(this.layout.bounds)
    this.view = { x: 0, y: 0, k: 1.5 }
    this.flyTo(end, 2400)
  }
  findGroup(lensId, groupId, subId) {
    const g = this.layouts[lensId]?.groups.find((x) => x.id === groupId)
    if (!g) return null
    return subId ? g.subs.find((s) => s.id === subId) || g : g
  }

  // ---------- state ----------
  setLens(id) {
    const next = this.layouts[id]
    if (!next || next === this.layout) return
    const from = this.layout
    this.layout = next
    this.hover = null
    this.kMin = this._fitView(next.bounds, {}).k * 0.75
    if (!this.reduced) this.morph = { from, t0: performance.now(), dur: 1300, e: 0 }
    this.invalidate()
  }
  setSelected(id) {
    this.selected = id
    this.invalidate()
  }
  setInset(inset) {
    this.inset = { right: 0, top: 0, bottom: 0, ...inset }
  }

  // ---------- input ----------
  _bind() {
    const canvas = this.canvas
    this._ac = new AbortController()
    const signal = this._ac.signal
    const c = {
      style: canvas.style,
      setPointerCapture: (id) => canvas.setPointerCapture(id),
      getBoundingClientRect: () => canvas.getBoundingClientRect(),
      addEventListener: (t, f, o) => canvas.addEventListener(t, f, { ...o, signal }),
    }
    const pos = (e) => {
      const r = c.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId)
      const p = pos(e)
      this.pointers.set(e.pointerId, p)
      this.drag = { x: p.x, y: p.y, moved: 0 }
      this.anim = null
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()]
        this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: this.view.k }
      }
    })
    c.addEventListener('pointermove', (e) => {
      const p = pos(e)
      if (this.pointers.has(e.pointerId)) {
        const prev = this.pointers.get(e.pointerId)
        this.pointers.set(e.pointerId, p)
        if (this.pointers.size === 2 && this.pinch) {
          const [a, b] = [...this.pointers.values()]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          this._zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, clamp((this.pinch.k * d) / this.pinch.d, this.kMin, 3))
          this.drag.moved = 99
        } else {
          const dx = p.x - prev.x
          const dy = p.y - prev.y
          this.drag.moved += Math.abs(dx) + Math.abs(dy)
          if (this.drag.moved > 4) {
            this.view.x -= dx / this.view.k
            this.view.y -= dy / this.view.k
            c.style.cursor = 'grabbing'
            this._setHover(null)
            this.invalidate()
          }
        }
        return
      }
      this._last = p
      if (!this.anim) this._setHover(this._hit(p.x, p.y))
    })
    const up = (e) => {
      const had = this.pointers.has(e.pointerId)
      this.pointers.delete(e.pointerId)
      if (this.pointers.size < 2) this.pinch = null
      c.style.cursor = ''
      if (!had || !this.drag || e.type === 'pointercancel') return
      if (this.drag.moved <= 4) {
        const p = pos(e)
        this._click(this._hit(p.x, p.y))
      }
      this.drag = null
    }
    c.addEventListener('pointerup', up)
    c.addEventListener('pointercancel', up)
    c.addEventListener('pointerleave', () => {
      this._last = null
      this._setHover(null)
    })
    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const p = pos(e)
        const unit = e.deltaMode === 1 ? 16 : 1
        const f = Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.012 : 0.0016))
        this.anim = null
        this._zoomAt(p.x, p.y, clamp(this.view.k * f, this.kMin, 3))
      },
      { passive: false },
    )
    c.addEventListener('dblclick', (e) => {
      const p = pos(e)
      if (this._hit(p.x, p.y)) return
      const w = this.toWorld(p.x, p.y)
      const k = clamp(this.view.k * 1.8, this.kMin, 3)
      this.flyTo({ x: w.x - (p.x - this.W / 2) / k, y: w.y - (p.y - this.H / 2) / k, k }, 350)
    })
  }
  _zoomAt(sx, sy, k) {
    const w = this.toWorld(sx, sy)
    this._setHover(null)
    this.view.k = k
    this.view.x = w.x - (sx - this.W / 2) / k
    this.view.y = w.y - (sy - this.H / 2) / k
    this.invalidate()
  }
  _hit(sx, sy) {
    const w = this.toWorld(sx, sy)
    const k = this.view.k
    const L = this.layout
    if (Math.hypot(w.x, w.y) < Math.max(105, 26 / k)) return { kind: 'root' }
    for (const g of L.groups) {
      if (Math.hypot(w.x - g.x, w.y - g.y) < Math.max(62, (this.coarse ? 24 : 17) / k)) return { kind: 'group', node: g }
      for (const s of g.subs)
        if (s._hw && Math.abs(w.x - s.x) < s._hw && Math.abs(w.y - s.y) < s._hh) return { kind: 'sub', node: s }
    }
    let best = null
    let bd = Math.max(LEAF_R + 8, (this.coarse ? 22 : 13) / k)
    for (const p of this.pastas) {
      const l = L.leaf[p.id]
      if (!l) continue
      const d = Math.hypot(w.x - l.x, w.y - l.y)
      if (d < bd) {
        bd = d
        best = p
      }
    }
    return best ? { kind: 'pasta', id: best.id } : null
  }
  _setHover(hit) {
    const key = hit ? hit.kind + (hit.id || hit.node?.id || '') : ''
    if (key === this._hoverKey) return
    this._hoverKey = key
    this.hover = hit
    this.canvas.style.cursor = hit ? 'pointer' : ''
    if (hit?.kind === 'pasta') {
      const l = this.layout.leaf[hit.id]
      const s = this.toScreen(l.x, l.y)
      this.h.onHover?.({ pasta: this.byId[hit.id], x: s.x, y: s.y, r: LEAF_R * this.view.k })
    } else this.h.onHover?.(null)
    this.invalidate()
  }
  _click(hit) {
    if (!hit) return this.h.onSelect?.(null)
    if (hit.kind === 'pasta') return this.h.onSelect?.(hit.id)
    if (hit.kind === 'root') return this.fitAll()
    this.fitNode(hit.node)
    this.h.onGroup?.(hit.node)
  }

  // ---------- render loop ----------
  invalidate() {
    if (this._raf) return
    this._raf = requestAnimationFrame((t) => {
      this._raf = 0
      this._frame(t)
    })
  }
  destroy() {
    cancelAnimationFrame(this._raf)
    this._ac.abort()
    this._dead = true
  }
  _frame(now) {
    if (this._dead) return
    let again = false
    if (this.anim) {
      const a = this.anim
      const t = clamp((now - a.t0) / a.dur, 0, 1)
      const e = ease(t)
      const kLow = Math.min(a.from.k, a.to.k)
      const dist = Math.hypot(a.to.x - a.from.x, a.to.y - a.from.y) * kLow
      const f = clamp((0.9 * Math.min(this.W, this.H)) / (dist || 1), 0.32, 1)
      const bump = 1 - (1 - f) * Math.sin(Math.PI * t)
      this.view = {
        x: lerp(a.from.x, a.to.x, e),
        y: lerp(a.from.y, a.to.y, e),
        k: Math.exp(lerp(Math.log(a.from.k), Math.log(a.to.k), e)) * bump,
      }
      if (t >= 1) {
        this.anim = null
        if (this._last) this._setHover(this._hit(this._last.x, this._last.y))
      } else again = true
    }
    if (this.morph) {
      const t = clamp((now - this.morph.t0) / this.morph.dur, 0, 1)
      this.morph.e = ease(t)
      if (t >= 1) this.morph = null
      else again = true
    }
    this._draw()
    this._context()
    if (again) this.invalidate()
  }
  _context() {
    // which territory is the camera over?
    const v = this.view
    const L = this.layout
    let key = ''
    let ctx = null
    const d = Math.hypot(v.x, v.y)
    if (v.k > 0.3 && d > L.R1 * 0.55) {
      let best = null
      let bd = Infinity
      for (const g of L.groups)
        for (const s of g.subs) {
          const dd = Math.hypot(s.x - v.x, s.y - v.y) - (d > L.R2 ? 0 : 200)
          if (dd < bd) {
            bd = dd
            best = s
          }
        }
      if (best) {
        const deep = v.k > 0.55 && d > L.R2 * 0.8
        ctx = { group: best.group, sub: deep ? best : null }
        key = best.group.id + (deep ? best.id : '')
      }
    }
    if (key !== this._ctxKey) {
      this._ctxKey = key
      this.h.onContext?.(ctx)
    }
  }

  // ---------- drawing ----------
  _draw() {
    const { ctx, W, H, dpr } = this
    const v = this.view
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.translate(W / 2, H / 2)
    ctx.scale(v.k, v.k)
    ctx.translate(-v.x, -v.y)

    const m = this.morph
    if (m) {
      this._structure(m.from, Math.pow(1 - m.e, 2))
      this._structure(this.layout, Math.pow(m.e, 2))
    } else this._structure(this.layout, 1)
    this._trail()
    this._leaves()
    if (m) this._nodes(m.from, Math.pow(1 - m.e, 2))
    this._nodes(this.layout, m ? Math.pow(m.e, 2) : 1)
    this._root()
  }

  _link(r0, a0, r1, a1) {
    const { ctx } = this
    const p0 = polar(r0, a0)
    const p1 = polar(r1, a1)
    const rm = (r0 + r1) / 2
    const c0 = polar(rm, a0)
    const c1 = polar(rm, a1)
    ctx.moveTo(p0.x, p0.y)
    ctx.bezierCurveTo(c0.x, c0.y, c1.x, c1.y, p1.x, p1.y)
  }

  _structure(L, alpha) {
    if (alpha < 0.01) return
    const { ctx } = this
    const k = this.view.k
    ctx.save()
    ctx.globalAlpha = alpha

    // guide rings
    ctx.strokeStyle = rgba(INK, 0.09)
    ctx.lineWidth = 1.2 / k
    ctx.setLineDash([6 / k, 9 / k])
    for (const r of [L.R1, L.R2, L.R3 - 96]) {
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, TAU)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // territories
    for (const g of L.groups) {
      const dim = this.focusGroup && this.focusGroup !== g.id
      ctx.beginPath()
      ctx.arc(0, 0, L.Rout + 105, g.aStart, g.aEnd)
      ctx.arc(0, 0, L.R1 * 0.72, g.aEnd, g.aStart, true)
      ctx.closePath()
      ctx.fillStyle = rgba(g.color, dim ? 0.03 : 0.085)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 0, L.Rout + 105, g.aStart, g.aEnd)
      ctx.strokeStyle = rgba(g.color, 0.55)
      ctx.lineWidth = Math.max(5, 2.5 / k)
      ctx.stroke()
      this._arcText(g.label.toUpperCase(), L.Rout + 215, g.a, g.aEnd - g.aStart, rgba(g.color, dim ? 0.35 : 0.9))
    }

    // branches
    ctx.lineCap = 'round'
    for (const g of L.groups) {
      ctx.strokeStyle = rgba(g.color, 0.75)
      ctx.lineWidth = Math.max(9, 2.2 / k)
      ctx.beginPath()
      this._link(60, g.a, g.r, g.a)
      ctx.stroke()
      ctx.lineWidth = Math.max(4.5, 1.4 / k)
      ctx.strokeStyle = rgba(g.color, 0.6)
      ctx.beginPath()
      for (const s of g.subs) this._link(g.r, g.a, s.r, s.a)
      ctx.stroke()
    }
    ctx.lineWidth = Math.max(2.2, 0.8 / k)
    for (const sp of L.spokes) {
      ctx.strokeStyle = rgba(sp.group.color, 0.42)
      ctx.beginPath()
      this._link(sp.sub.r, sp.sub.a, sp.r0, sp.a)
      const e = polar(sp.r1, sp.a)
      ctx.lineTo(e.x, e.y)
      ctx.stroke()
    }
    ctx.restore()
  }

  _arcText(text, r, aMid, span, color) {
    const { ctx } = this
    let size = 165
    ctx.save()
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const measure = () => {
      ctx.font = `700 ${size}px ${SERIF}`
      const sp = size * 0.16
      const ws = [...text].map((ch) => ctx.measureText(ch).width + sp)
      return { ws, total: ws.reduce((a, b) => a + b, 0) }
    }
    let m = measure()
    const max = span * r * 0.94
    if (m.total > max) {
      size = Math.max(54, (size * max) / m.total)
      m = measure()
    }
    const flip = Math.sin(aMid) > 0.15
    const dir = flip ? -1 : 1
    let a = aMid - (dir * m.total) / r / 2
    ;[...text].forEach((ch, i) => {
      const w = m.ws[i]
      a += (dir * w) / r / 2
      ctx.save()
      ctx.translate(Math.cos(a) * r, Math.sin(a) * r)
      ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2))
      ctx.fillText(ch, 0, 0)
      ctx.restore()
      a += (dir * w) / r / 2
    })
    ctx.restore()
  }

  // highlighted route from the centre to the hovered / selected pasta
  _trail() {
    const { ctx } = this
    const k = this.view.k
    const ids = []
    if (this.selected) ids.push(this.selected)
    if (this.hover?.kind === 'pasta' && this.hover.id !== this.selected) ids.push(this.hover.id)
    for (const id of ids) {
      const l = this.layout.leaf[id]
      if (!l || this.morph) continue
      const { group: g, sub: s } = l
      ctx.save()
      ctx.strokeStyle = g.color
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = Math.max(8, 3 / k)
      ctx.beginPath()
      this._link(60, g.a, g.r, g.a)
      this._link(g.r, g.a, s.r, s.a)
      this._link(s.r, s.a, this.layout.R3 - 96, l.a)
      ctx.lineTo(l.x, l.y)
      ctx.stroke()
      ctx.restore()
    }
    const h = this.hover
    if (h && (h.kind === 'group' || h.kind === 'sub') && !this.morph) {
      const g = h.kind === 'group' ? h.node : h.node.group
      ctx.save()
      ctx.strokeStyle = g.color
      ctx.lineCap = 'round'
      ctx.lineWidth = Math.max(10, 3 / k)
      ctx.beginPath()
      this._link(60, g.a, g.r, g.a)
      if (h.kind === 'sub') this._link(g.r, g.a, h.node.r, h.node.a)
      ctx.stroke()
      ctx.restore()
    }
  }

  _leaves() {
    const { ctx, W, H } = this
    const v = this.view
    const k = v.k
    const halfW = W / 2 / k + 120
    const halfH = H / 2 / k + 120
    const glyphs = k >= 0.2
    const labels = k >= 0.52
    const labelAlpha = clamp((k - 0.52) / 0.1, 0, 1)
    const fontPx = Math.max(15, 10.5 / k)
    const hoverId = this.hover?.kind === 'pasta' ? this.hover.id : null
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.lineJoin = 'round'
    for (const p of this.pastas) {
      const l = this.leafPos(p.id)
      if (!l) continue
      if (Math.abs(l.x - v.x) > halfW || Math.abs(l.y - v.y) > halfH) continue
      const g = l.group
      const dim = this.focusGroup && this.focusGroup !== g.id
      const active = p.id === this.selected || p.id === hoverId
      ctx.globalAlpha = dim ? 0.3 : 1
      if (!glyphs) {
        ctx.beginPath()
        ctx.arc(l.x, l.y, Math.max(24, 2.6 / k), 0, TAU)
        ctx.fillStyle = active ? INK : g.color
        ctx.fill()
        continue
      }
      ctx.beginPath()
      ctx.arc(l.x, l.y, LEAF_R, 0, TAU)
      ctx.fillStyle = PAPER
      ctx.fill()
      ctx.fillStyle = rgba(g.color, active ? 0.3 : 0.14)
      ctx.fill()
      ctx.lineWidth = active ? Math.max(4, 2 / k) : Math.max(1.6, 0.8 / k)
      ctx.strokeStyle = active ? g.color : rgba(g.color, 0.55)
      ctx.stroke()
      if (p.id === this.selected) {
        ctx.beginPath()
        ctx.arc(l.x, l.y, LEAF_R + 9, 0, TAU)
        ctx.lineWidth = Math.max(2, 1.2 / k)
        ctx.strokeStyle = INK
        ctx.stroke()
      }
      if (k >= 0.27) drawGlyph(ctx, p.glyph, l.x, l.y, 52, MAKE[p.make]?.fill, '#4a3015')
      else {
        ctx.beginPath()
        ctx.arc(l.x, l.y, 13, 0, TAU)
        ctx.fillStyle = MAKE[p.make]?.fill || '#edc55f'
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#4a3015'
        ctx.stroke()
      }
      if (labels || active) {
        ctx.globalAlpha = (dim ? 0.3 : 1) * (active ? 1 : labelAlpha)
        ctx.font = `${active ? 700 : 600} ${fontPx}px ${SANS}`
        const lines = this.lines[p.id]
        lines.forEach((t, i) => {
          const y = l.y + LEAF_R + 7 + i * fontPx * 1.12
          ctx.lineWidth = fontPx * 0.32
          ctx.strokeStyle = PAPER
          ctx.strokeText(t, l.x, y)
          ctx.fillStyle = INK
          ctx.fillText(t, l.x, y)
        })
      }
    }
    ctx.globalAlpha = 1
  }

  _nodes(L, alpha) {
    if (alpha < 0.01) return
    const { ctx } = this
    const k = this.view.k
    const h = this.hover
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'

    // subgroup pills
    const showSub = k >= 0.24
    const subFont = Math.max(21, 11.5 / k)
    ctx.font = `600 ${subFont}px ${SANS}`
    for (const g of L.groups)
      for (const s of g.subs) {
        if (!showSub) {
          s._hw = 0
          ctx.beginPath()
          ctx.arc(s.x, s.y, Math.max(11, 2.2 / k), 0, TAU)
          ctx.fillStyle = g.color
          ctx.fill()
          continue
        }
        const text = s.label
        const tw = ctx.measureText(text).width
        const hw = tw / 2 + subFont * 0.75
        const hh = subFont * 0.92
        s._hw = hw
        s._hh = hh
        const hot = h?.kind === 'sub' && h.node === s
        ctx.beginPath()
        ctx.roundRect(s.x - hw, s.y - hh, hw * 2, hh * 2, hh)
        ctx.fillStyle = hot ? g.color : PAPER
        ctx.fill()
        ctx.lineWidth = Math.max(2.4, 1.2 / k)
        ctx.strokeStyle = g.color
        ctx.stroke()
        ctx.fillStyle = hot ? '#fff' : INK
        ctx.fillText(text, s.x, s.y + subFont * 0.04)
      }

    // group medallions
    for (const g of L.groups) {
      const r = Math.max(62, 17 / k)
      const hot = h?.kind === 'group' && h.node === g
      ctx.beginPath()
      ctx.arc(g.x, g.y, r, 0, TAU)
      ctx.fillStyle = g.color
      ctx.fill()
      ctx.lineWidth = r * (hot ? 0.16 : 0.09)
      ctx.strokeStyle = PAPER
      ctx.stroke()
      if (hot) {
        ctx.beginPath()
        ctx.arc(g.x, g.y, r * 1.12, 0, TAU)
        ctx.lineWidth = r * 0.05
        ctx.strokeStyle = g.color
        ctx.stroke()
      }
      if (g.sample) drawGlyph(ctx, g.sample.glyph, g.x, g.y, r * 1.25, '#fff6dc', rgba('#2a1a08', 0.85))
      if (k < 0.24 && !hot) continue
      const f = Math.max(34, 13.5 / k)
      ctx.font = `700 ${f}px ${SERIF}`
      const y = g.y + r + f * 0.85
      ctx.lineWidth = f * 0.34
      ctx.strokeStyle = PAPER
      ctx.strokeText(g.label, g.x, y)
      ctx.fillStyle = INK
      ctx.fillText(g.label, g.x, y)
      const f2 = f * 0.62
      ctx.font = `600 ${f2}px ${SANS}`
      const y2 = y + f * 0.95
      const t2 = `${g.count} ${g.count === 1 ? 'shape' : 'shapes'}`
      ctx.lineWidth = f2 * 0.4
      ctx.strokeText(t2, g.x, y2)
      ctx.fillStyle = g.color
      ctx.fillText(t2, g.x, y2)
    }
    ctx.restore()
  }

  _root() {
    const { ctx } = this
    const k = this.view.k
    const r = Math.max(112, 27 / k)
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, TAU)
    ctx.fillStyle = INK
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.88, 0, TAU)
    ctx.strokeStyle = rgba('#edc55f', 0.8)
    ctx.lineWidth = r * 0.025
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#f7e7b8'
    ctx.font = `italic 700 ${r * 0.44}px ${SERIF}`
    ctx.fillText('Pasta', 0, -r * 0.1)
    ctx.font = `600 ${r * 0.15}px ${SANS}`
    ctx.fillStyle = rgba('#f7e7b8', 0.75)
    ctx.fillText(`${this.pastas.length} SHAPES`, 0, r * 0.32)
    ctx.restore()
  }
}
