// Radial branching layout: root → groups → subgroups → spokes of pastas.

const ROWS = 6 // pastas per spoke
const SLOT = 160 // arc length between neighbouring spokes at the inner ring
const RSTEP = 150 // radial distance between pastas on a spoke
const SUB_GAP = 0.7 // gaps, measured in spokes
const GROUP_GAP = 2.2

export const polar = (r, a) => ({ x: Math.cos(a) * r, y: Math.sin(a) * r })

export function buildLayout(pastas, lens) {
  // bucket
  const groups = lens.groups
    .map((g) => ({ ...g, kind: 'group', subs: new Map(), count: 0 }))
  const gById = Object.fromEntries(groups.map((g) => [g.id, g]))
  for (const p of pastas) {
    const g = gById[lens.group(p)]
    if (!g) continue
    const s = lens.sub(p)
    if (!g.subs.has(s.id)) g.subs.set(s.id, { ...s, kind: 'sub', group: g, leaves: [] })
    g.subs.get(s.id).leaves.push(p)
    g.count++
  }
  const live = groups.filter((g) => g.count)
  for (const g of live) {
    g.subs = [...g.subs.values()].sort((a, b) => a.order - b.order || b.leaves.length - a.leaves.length || a.label.localeCompare(b.label))
    for (const s of g.subs) s.spokes = Math.ceil(s.leaves.length / ROWS)
  }

  let units = 0
  for (const g of live) {
    units += GROUP_GAP
    g.subs.forEach((s, i) => (units += s.spokes + (i ? SUB_GAP : 0)))
  }
  const R3 = Math.max(1250, (units * SLOT) / (Math.PI * 2))
  const R2 = R3 * 0.8
  const R1 = R3 * 0.5
  const da = (Math.PI * 2) / units
  const Rout = R3 + (ROWS - 1) * RSTEP

  const leaf = {} // id -> {x,y,a,r,group,sub}
  const spokes = []
  let u = GROUP_GAP / 2
  const a0 = -Math.PI / 2
  for (const g of live) {
    g.aStart = a0 + (u - GROUP_GAP / 2 + 0.25) * da
    const first = u
    g.subs.forEach((s, i) => {
      if (i) u += SUB_GAP
      const sFirst = u
      const per = Math.ceil(s.leaves.length / s.spokes)
      for (let k = 0; k < s.spokes; k++) {
        const a = a0 + (u + 0.5) * da
        const items = s.leaves.slice(k * per, (k + 1) * per)
        items.forEach((p, j) => {
          const r = R3 + j * RSTEP
          leaf[p.id] = { ...polar(r, a), a, r, group: g, sub: s }
        })
        spokes.push({ a, r0: R3 - 96, r1: R3 + (items.length - 1) * RSTEP, sub: s, group: g })
        u += 1
      }
      s.a = a0 + ((sFirst + u) / 2) * da
      Object.assign(s, polar(R2, s.a))
      s.r = R2
    })
    g.a = a0 + ((first + u) / 2) * da
    g.aEnd = a0 + (u + GROUP_GAP / 2 - 0.25) * da
    Object.assign(g, polar(R1, g.a))
    g.r = R1
    g.sample = g.subs[0].leaves[0]
    u += GROUP_GAP
  }

  for (const g of live) {
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
    const grow = (bb, x, y) => {
      bb.x0 = Math.min(bb.x0, x)
      bb.y0 = Math.min(bb.y0, y)
      bb.x1 = Math.max(bb.x1, x)
      bb.y1 = Math.max(bb.y1, y)
    }
    for (const s of g.subs) {
      const sb = { x0: s.x, y0: s.y, x1: s.x, y1: s.y }
      for (const p of s.leaves) {
        const l = leaf[p.id]
        grow(sb, l.x, l.y)
        grow(b, l.x, l.y)
      }
      grow(b, s.x, s.y)
      s.bounds = sb
    }
    g.bounds = b
  }

  const R = Rout + 420
  return { lens, groups: live, leaf, spokes, R1, R2, R3, Rout, bounds: { x0: -R, y0: -R, x1: R, y1: R } }
}
