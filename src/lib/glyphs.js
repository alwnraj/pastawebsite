// Vector drawings of pasta archetypes. Every glyph draws inside a unit box
// (-1..1) on a 2D canvas context the caller has already translated and scaled.
// o = { fill, ink, shade } colours.

const LW = 0.075
const TAU = Math.PI * 2

const fs = (c) => {
  c.fill()
  c.stroke()
}

// A thick line with an ink outline: the basis of every noodle.
function noodle(c, o, w, build) {
  c.save()
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.beginPath()
  build(c)
  c.lineWidth = w + LW * 2
  c.strokeStyle = o.ink
  c.stroke()
  c.lineWidth = w
  c.strokeStyle = o.fill
  c.stroke()
  c.restore()
}

function line(c, pts) {
  c.beginPath()
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
  c.stroke()
}

function wave(c, x0, x1, y, amp, periods, phase = 0, steps = 40) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = x0 + (x1 - x0) * t
    const yy = y + Math.sin(phase + t * periods * TAU) * amp
    i ? c.lineTo(x, yy) : c.moveTo(x, yy)
  }
}

function tube(c, o, { L = 0.72, r = 0.3, e = 0.12, ridged = false, rot = -0.45, end = null } = {}) {
  c.save()
  c.rotate(rot)
  c.beginPath()
  c.moveTo(-L, -r)
  c.lineTo(L, -r)
  c.ellipse(L, 0, e, r, 0, -Math.PI / 2, Math.PI / 2)
  c.lineTo(-L, r)
  c.ellipse(-L, 0, e, r, 0, Math.PI / 2, (Math.PI * 3) / 2)
  c.closePath()
  fs(c)
  if (ridged) {
    c.save()
    c.lineWidth = LW * 0.6
    for (const f of [-0.55, 0, 0.55]) {
      const dx = e * Math.sqrt(1 - f * f)
      line(c, [[-L - dx, r * f], [L + dx * 0.2, r * f]])
    }
    c.restore()
  }
  c.beginPath()
  c.ellipse(L, 0, e, r, 0, 0, TAU)
  c.fillStyle = end || o.shade
  fs(c)
  c.restore()
}

function star(c, cx, cy, R, r, n = 5, rot = -Math.PI / 2) {
  c.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n
    const rr = i % 2 ? r : R
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    i ? c.lineTo(x, y) : c.moveTo(x, y)
  }
  c.closePath()
}

// Closed polygon with pinked (zigzag) edges, like a pastry-wheel cut.
function zigPoly(c, pts, teeth = 5, amp = 0.07) {
  c.beginPath()
  let first = true
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[(i + 1) % pts.length]
    const len = Math.hypot(bx - ax, by - ay)
    const nx = -(by - ay) / len
    const ny = (bx - ax) / len
    const n = teeth * 2
    for (let k = 0; k < n; k++) {
      const t = k / n
      const s = k % 2 ? amp : -amp
      const x = ax + (bx - ax) * t + nx * s
      const y = ay + (by - ay) * t + ny * s
      first ? c.moveTo(x, y) : c.lineTo(x, y)
      first = false
    }
  }
  c.closePath()
}

function scallop(c, cx, cy, R, n, amp, a0 = 0, a1 = TAU, move = true) {
  const steps = Math.max(24, Math.round(((a1 - a0) / TAU) * 96))
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    const rr = R + amp * Math.abs(Math.sin((n * a) / 2))
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    i === 0 && move ? c.moveTo(x, y) : c.lineTo(x, y)
  }
}

const at = (c, x, y, s, rot, fn) => {
  c.save()
  c.translate(x, y)
  c.rotate(rot)
  c.scale(s, s)
  c.lineWidth = LW / s
  fn()
  c.restore()
}

const G = {
  strand(c, o, n = 5, w = 0.07, gap = 0.2) {
    for (let i = 0; i < n; i++) {
      const d = (i - (n - 1) / 2) * gap
      noodle(c, o, w, (c) => {
        c.moveTo(-0.85 + d * 0.4, 0.55 + d)
        c.bezierCurveTo(-0.3 + d, -0.9 + d, 0.2 + d, 0.9 + d, 0.85 + d * 0.4, -0.55 + d)
      })
    }
  },
  'strand-thick'(c, o) {
    G.strand(c, o, 3, 0.16, 0.36)
  },
  'strand-hollow'(c, o) {
    G.strand(c, o, 2, 0.24, 0.5)
    for (const d of [-0.25, 0.25]) {
      c.beginPath()
      c.arc(0.85 + d * 0.4, -0.55 + d, 0.06, 0, TAU)
      c.fillStyle = o.ink
      c.fill()
    }
  },
  'strand-nest'(c, o, w = 0.07, turns = 4) {
    noodle(c, o, w, (c) => {
      for (let i = 0; i <= 200; i++) {
        const t = i / 200
        const a = t * turns * TAU
        const r = 0.12 + t * 0.72
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r * 0.8 + Math.sin(a * 3) * 0.02
        i ? c.lineTo(x, y) : c.moveTo(x, y)
      }
    })
  },
  'strand-rope'(c, o) {
    noodle(c, o, 0.2, (c) => {
      c.moveTo(-0.85, 0.2)
      c.bezierCurveTo(-0.5, -0.75, -0.15, 0.7, 0.2, -0.05)
      c.bezierCurveTo(0.4, -0.5, 0.7, -0.45, 0.85, -0.2)
    })
    noodle(c, o, 0.17, (c) => {
      c.moveTo(-0.6, 0.72)
      c.bezierCurveTo(-0.2, 0.3, 0.3, 0.95, 0.8, 0.45)
    })
  },
  ribbon(c, o, w = 0.2, n = 2) {
    for (let i = 0; i < n; i++) {
      const d = (i - (n - 1) / 2) * 0.55
      noodle(c, o, w, (c) => wave(c, -0.85, 0.85, d, 0.26, 1.1, i * 1.3))
    }
  },
  'ribbon-wide'(c, o) {
    G.ribbon(c, o, 0.52, 1)
    c.save()
    c.lineWidth = LW * 0.5
    c.globalAlpha = 0.5
    c.beginPath()
    wave(c, -0.8, 0.8, 0, 0.26, 1.1)
    c.stroke()
    c.restore()
  },
  'ribbon-ruffled'(c, o) {
    c.save()
    c.rotate(-0.3)
    const edge = (y, ph) => wave(c, -0.9, 0.9, y, 0.085, 7, ph, 90)
    c.beginPath()
    edge(-0.36, 0)
    for (let i = 90; i >= 0; i--) {
      const t = i / 90
      c.lineTo(-0.9 + 1.8 * t, 0.36 + Math.sin(1 + t * 7 * TAU) * 0.085)
    }
    c.closePath()
    fs(c)
    c.lineWidth = LW * 0.6
    line(c, [[-0.9, -0.17], [0.9, -0.17]])
    line(c, [[-0.9, 0.17], [0.9, 0.17]])
    c.restore()
  },
  'ribbon-nest'(c, o) {
    G['strand-nest'](c, o, 0.15, 2.6)
  },
  sheet(c, o, ruffled = false) {
    c.save()
    c.rotate(-0.2)
    c.beginPath()
    if (ruffled) {
      wave(c, -0.85, 0.85, -0.5, 0.07, 6, 0, 80)
      for (let i = 80; i >= 0; i--) {
        const t = i / 80
        c.lineTo(-0.85 + 1.7 * t, 0.5 + Math.sin(t * 6 * TAU) * 0.07)
      }
      c.closePath()
    } else {
      c.rect(-0.85, -0.5, 1.7, 1)
    }
    fs(c)
    c.lineWidth = LW * 0.5
    c.globalAlpha = 0.45
    if (ruffled) {
      line(c, [[-0.85, -0.3], [0.85, -0.3]])
      line(c, [[-0.85, 0.3], [0.85, 0.3]])
    } else {
      line(c, [[-0.6, -0.25], [0.3, -0.25]])
      line(c, [[-0.3, 0.2], [0.6, 0.2]])
    }
    c.restore()
  },
  'sheet-ruffled'(c, o) {
    G.sheet(c, o, true)
  },
  scrap(c, o) {
    const shapes = [
      [[-0.9, -0.25], [-0.2, -0.8], [0.25, -0.3], [-0.45, 0.2]],
      [[0.0, 0.05], [0.85, -0.35], [0.9, 0.4], [0.3, 0.75]],
      [[-0.75, 0.4], [-0.15, 0.3], [0.05, 0.85], [-0.6, 0.85]],
    ]
    for (const s of shapes) {
      c.beginPath()
      s.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
      c.closePath()
      fs(c)
    }
  },
  tube(c, o) {
    tube(c, o, { L: 0.62, r: 0.3, e: 0.11 })
  },
  'tube-ridged'(c, o) {
    tube(c, o, { L: 0.62, r: 0.34, e: 0.12, ridged: true })
  },
  penne(c, o, ridged = false) {
    tube(c, o, { L: 0.58, r: 0.25, e: 0.27, ridged })
  },
  'penne-ridged'(c, o) {
    G.penne(c, o, true)
  },
  elbow(c, o) {
    noodle(c, { ...o }, 0.36, (c) => {
      c.lineCap = 'butt'
      c.arc(0.05, 0.3, 0.55, Math.PI * 1.02, Math.PI * 1.98)
    })
    for (const x of [-0.5, 0.6]) {
      c.beginPath()
      c.ellipse(x, 0.3, 0.2, 0.07, 0, 0, TAU)
      c.fillStyle = o.shade
      fs(c)
    }
  },
  'tube-giant'(c, o) {
    tube(c, o, { L: 0.36, r: 0.56, e: 0.2, rot: -0.3 })
  },
  ring(c, o) {
    c.save()
    c.rotate(-0.25)
    c.beginPath()
    c.ellipse(0, 0.12, 0.78, 0.5, 0, 0, TAU)
    fs(c)
    c.beginPath()
    c.ellipse(0, -0.08, 0.78, 0.5, 0, 0, TAU)
    fs(c)
    c.beginPath()
    c.ellipse(0, -0.08, 0.52, 0.3, 0, 0, TAU)
    c.fillStyle = o.shade
    fs(c)
    c.restore()
  },
  corkscrew(c, o) {
    c.save()
    c.rotate(-0.45)
    for (let i = 0; i < 6; i++) {
      c.beginPath()
      c.ellipse(-0.7 + i * 0.28, 0, 0.17, 0.42, 0.55, 0, TAU)
      fs(c)
    }
    c.restore()
  },
  twist(c, o) {
    c.save()
    c.rotate(-0.45)
    noodle(c, o, 0.2, (c) => wave(c, -0.85, 0.85, 0, 0.2, 2.5, 0))
    for (let k = 0; k < 5; k++) {
      // over-crossing segments of the second strand
      const x0 = -0.85 + (k * 1.7) / 5
      noodle(c, o, 0.2, (c) => {
        for (let i = 0; i <= 10; i++) {
          const t = (k + 0.25 + (i / 10) * 0.5) / 5
          const x = -0.85 + 1.7 * t
          const y = Math.sin(Math.PI + t * 2.5 * TAU) * 0.2
          i ? c.lineTo(x, y) : c.moveTo(x, y)
        }
      })
      void x0
    }
    c.restore()
  },
  scroll(c, o) {
    c.save()
    c.rotate(-0.45)
    noodle(c, o, 0.46, (c) => {
      c.moveTo(-0.65, 0.05)
      c.quadraticCurveTo(0, -0.14, 0.65, 0.05)
    })
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(-0.72, 0.08)
    c.quadraticCurveTo(0, -0.1, 0.72, 0.08)
    c.stroke()
    c.beginPath()
    c.arc(0.72, -0.04, 0.12, Math.PI / 2, Math.PI * 1.7, true)
    c.stroke()
    c.beginPath()
    c.arc(-0.72, 0.2, 0.12, -Math.PI / 2, Math.PI * 0.7, true)
    c.stroke()
    c.restore()
  },
  helix(c, o) {
    c.save()
    c.rotate(-0.45)
    noodle(c, o, 0.26, (c) => wave(c, -0.8, 0.8, 0, 0.3, 2.25, 0, 70))
    c.beginPath()
    c.arc(0.8, 0.3, 0.07, 0, TAU)
    c.fillStyle = o.ink
    c.fill()
    c.restore()
  },
  shell(c, o) {
    c.save()
    c.rotate(-0.3)
    c.beginPath()
    c.moveTo(-0.88, 0.05)
    c.bezierCurveTo(-0.6, -0.85, 0.6, -0.85, 0.88, 0.05)
    c.bezierCurveTo(0.6, 0.6, -0.6, 0.6, -0.88, 0.05)
    c.closePath()
    fs(c)
    c.beginPath()
    c.moveTo(-0.8, 0.1)
    c.bezierCurveTo(-0.4, 0.42, 0.4, 0.42, 0.8, 0.1)
    c.bezierCurveTo(0.4, 0.05, -0.4, 0.05, -0.8, 0.1)
    c.fillStyle = o.shade
    fs(c)
    c.lineWidth = LW * 0.6
    for (const k of [-0.62, -0.38, -0.14]) {
      c.beginPath()
      c.moveTo(-0.84, 0.02)
      c.quadraticCurveTo(0, k * 1.9 + 0.1, 0.84, 0.02)
      c.stroke()
    }
    c.restore()
  },
  cavatello(c, o) {
    c.save()
    c.rotate(-0.45)
    c.beginPath()
    c.ellipse(0, 0, 0.82, 0.4, 0, 0, TAU)
    fs(c)
    c.beginPath()
    c.ellipse(0, 0.04, 0.6, 0.13, 0, 0, TAU)
    c.fillStyle = o.shade
    fs(c)
    c.lineWidth = LW * 0.6
    for (let i = -3; i <= 3; i++) line(c, [[i * 0.19, -0.37 + Math.abs(i) * 0.035], [i * 0.19, -0.2]])
    c.restore()
  },
  ear(c, o) {
    c.beginPath()
    c.arc(0, 0, 0.78, 0, TAU)
    fs(c)
    c.beginPath()
    c.ellipse(0.06, 0.08, 0.5, 0.46, 0, 0, TAU)
    c.fillStyle = o.shade
    fs(c)
    c.save()
    c.lineWidth = LW * 0.5
    c.globalAlpha = 0.6
    for (const a of [3.4, 3.9, 4.4, 4.9]) {
      c.beginPath()
      c.arc(0, 0, 0.64, a, a + 0.25)
      c.stroke()
    }
    c.restore()
  },
  bowtie(c, o) {
    const zig = (x, y0, y1, dir) => {
      const n = 6
      for (let i = 0; i <= n; i++) c.lineTo(x + (i % 2 ? dir * 0.09 : 0), y0 + ((y1 - y0) * i) / n)
    }
    c.beginPath()
    c.moveTo(-0.85, -0.62)
    zig(-0.85, -0.62, 0.62, -1)
    c.quadraticCurveTo(-0.3, 0.5, 0, 0.17)
    c.quadraticCurveTo(0.3, 0.5, 0.85, 0.62)
    zig(0.85, 0.62, -0.62, 1)
    c.quadraticCurveTo(0.3, -0.5, 0, -0.17)
    c.quadraticCurveTo(-0.3, -0.5, -0.85, -0.62)
    c.closePath()
    fs(c)
    c.lineWidth = LW * 0.7
    for (const x of [-0.1, 0.1]) {
      c.beginPath()
      c.moveTo(x, -0.2)
      c.quadraticCurveTo(x * -0.6, 0, x, 0.2)
      c.stroke()
    }
  },
  wheel(c, o) {
    c.beginPath()
    c.arc(0, 0, 0.84, 0, TAU)
    fs(c)
    c.fillStyle = o.shade
    for (let i = 0; i < 6; i++) {
      const a0 = (i * TAU) / 6 + 0.13
      const a1 = ((i + 1) * TAU) / 6 - 0.13
      c.beginPath()
      c.arc(0, 0, 0.64, a0, a1)
      c.arc(0, 0, 0.3, a1 - 0.1, a0 + 0.1, true)
      c.closePath()
      fs(c)
    }
  },
  radiator(c, o) {
    c.save()
    c.rotate(-0.3)
    for (let i = 0; i < 6; i++) {
      c.beginPath()
      c.ellipse(-0.65 + i * 0.26, 0, 0.14, 0.62, 0, 0, TAU)
      fs(c)
    }
    c.beginPath()
    c.rect(-0.78, -0.12, 1.56, 0.24)
    fs(c)
    c.restore()
  },
  bell(c, o) {
    c.save()
    c.rotate(-0.35)
    c.beginPath()
    c.moveTo(-0.85, 0)
    c.quadraticCurveTo(-0.1, -0.2, 0.5, -0.7)
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      c.lineTo(0.5 + Math.sin(t * Math.PI) * 0.22 + Math.sin(t * 5 * TAU) * 0.05, -0.7 + 1.4 * t)
    }
    c.quadraticCurveTo(-0.1, 0.2, -0.85, 0)
    c.closePath()
    fs(c)
    c.beginPath()
    c.ellipse(0.52, 0, 0.13, 0.5, 0, 0, TAU)
    c.fillStyle = o.shade
    fs(c)
    c.restore()
  },
  leaf(c, o) {
    c.save()
    c.rotate(-0.5)
    c.beginPath()
    c.moveTo(-0.9, 0)
    c.quadraticCurveTo(0, -0.62, 0.9, 0)
    c.quadraticCurveTo(0, 0.62, -0.9, 0)
    c.closePath()
    fs(c)
    c.lineWidth = LW * 0.7
    c.beginPath()
    c.moveTo(-0.7, 0)
    c.quadraticCurveTo(0, 0.12, 0.7, 0)
    c.stroke()
    c.restore()
  },
  coin(c, o) {
    c.beginPath()
    c.arc(0, 0, 0.82, 0, TAU)
    fs(c)
    c.lineWidth = LW * 0.6
    c.beginPath()
    c.arc(0, 0, 0.62, 0, TAU)
    c.stroke()
    star(c, 0, 0, 0.42, 0.16, 6)
    c.stroke()
  },
  'braid-ring'(c, o) {
    c.beginPath()
    c.arc(0, 0, 0.84, 0, TAU)
    c.arc(0, 0, 0.42, 0, TAU, true)
    c.fill('evenodd')
    c.beginPath()
    c.arc(0, 0, 0.84, 0, TAU)
    c.stroke()
    c.beginPath()
    c.arc(0, 0, 0.42, 0, TAU)
    c.stroke()
    c.lineWidth = LW * 0.7
    for (let i = 0; i < 14; i++) {
      const a = (i * TAU) / 14
      c.beginPath()
      c.moveTo(Math.cos(a) * 0.44, Math.sin(a) * 0.44)
      c.lineTo(Math.cos(a + 0.5) * 0.82, Math.sin(a + 0.5) * 0.82)
      c.stroke()
    }
  },
  grain(c, o) {
    const g = [[-0.5, -0.4, 0.5], [0.35, -0.5, -0.6], [0.0, 0.05, 0.2], [-0.5, 0.5, -0.3], [0.5, 0.45, 0.9]]
    for (const [x, y, r] of g)
      at(c, x, y, 0.36, r, () => {
        c.beginPath()
        c.moveTo(-0.9, 0)
        c.quadraticCurveTo(0, -0.7, 0.9, 0)
        c.quadraticCurveTo(0, 0.7, -0.9, 0)
        c.closePath()
        fs(c)
      })
  },
  dots(c) {
    const d = [[-0.55, -0.5], [0, -0.62], [0.55, -0.42], [-0.3, -0.08], [0.28, -0.05], [-0.62, 0.3], [0, 0.4], [0.6, 0.35], [-0.3, 0.7], [0.32, 0.72]]
    for (const [x, y] of d) {
      c.beginPath()
      c.arc(x, y, 0.17, 0, TAU)
      fs(c)
    }
  },
  star(c, o) {
    for (const [x, y, s, r] of [[-0.4, -0.38, 0.5, 0.2], [0.42, -0.1, 0.44, 0.7], [-0.15, 0.48, 0.46, -0.3]])
      at(c, x, y, s, r, () => {
        star(c, 0, 0, 1, 0.48, 5)
        fs(c)
        c.beginPath()
        c.arc(0, 0, 0.2, 0, TAU)
        c.fillStyle = o.shade
        fs(c)
      })
  },
  ringlets(c, o) {
    for (const [x, y, s] of [[-0.48, -0.42, 0.34], [0.38, -0.5, 0.3], [0.02, 0.02, 0.32], [-0.5, 0.48, 0.3], [0.5, 0.42, 0.34]])
      at(c, x, y, s, 0, () => {
        c.beginPath()
        c.arc(0, 0, 1, 0, TAU)
        c.arc(0, 0, 0.5, 0, TAU, true)
        c.fill('evenodd')
        c.beginPath()
        c.arc(0, 0, 1, 0, TAU)
        c.stroke()
        c.beginPath()
        c.arc(0, 0, 0.5, 0, TAU)
        c.stroke()
      })
  },
  'tiny-tubes'(c, o) {
    for (const [x, y, r] of [[-0.45, -0.42, 0.3], [0.42, -0.4, -0.9], [-0.05, 0.1, 1.2], [-0.5, 0.55, -0.4], [0.5, 0.5, 0.5]])
      at(c, x, y, 0.42, r, () => tube(c, o, { L: 0.42, r: 0.42, e: 0.16, rot: 0 }))
  },
  'tiny-squares'(c) {
    for (const [x, y, r] of [[-0.48, -0.45, 0.2], [0.42, -0.42, -0.4], [0, 0.05, 0.7], [-0.5, 0.52, -0.2], [0.5, 0.5, 0.35]])
      at(c, x, y, 0.27, r, () => {
        c.beginPath()
        c.rect(-1, -1, 2, 2)
        fs(c)
      })
  },
  letters(c, o) {
    c.save()
    c.font = '800 0.95px Georgia, serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.lineJoin = 'round'
    for (const [ch, x, y, r] of [['A', -0.42, -0.3, -0.2], ['B', 0.42, -0.2, 0.25], ['C', -0.05, 0.5, 0.1]]) {
      c.save()
      c.translate(x, y)
      c.rotate(r)
      c.lineWidth = LW * 2
      c.strokeText(ch, 0, 0)
      c.fillText(ch, 0, 0)
      c.restore()
    }
    c.restore()
  },
  ravioli(c, o) {
    zigPoly(c, [[-0.78, -0.78], [0.78, -0.78], [0.78, 0.78], [-0.78, 0.78]], 5, 0.06)
    fs(c)
    c.beginPath()
    c.roundRect(-0.46, -0.46, 0.92, 0.92, 0.22)
    c.fillStyle = o.shade
    fs(c)
  },
  'round-ravioli'(c, o) {
    c.beginPath()
    scallop(c, 0, 0, 0.74, 16, 0.1)
    c.closePath()
    fs(c)
    c.beginPath()
    c.arc(0, 0, 0.44, 0, TAU)
    c.fillStyle = o.shade
    fs(c)
  },
  'half-moon'(c, o) {
    c.save()
    c.translate(0, 0.32)
    c.beginPath()
    scallop(c, 0, 0, 0.8, 14, 0.09, Math.PI, TAU)
    c.closePath()
    fs(c)
    c.beginPath()
    c.arc(0, -0.04, 0.48, Math.PI, TAU)
    c.closePath()
    c.fillStyle = o.shade
    fs(c)
    c.restore()
  },
  tortellino(c, o) {
    noodle(c, o, 0.44, (c) => c.arc(0, 0.12, 0.45, Math.PI * 0.72, Math.PI * 2.28))
    c.beginPath()
    c.moveTo(-0.46, -0.3)
    c.quadraticCurveTo(0, -1.05, 0.46, -0.3)
    c.quadraticCurveTo(0, -0.52, -0.46, -0.3)
    c.closePath()
    fs(c)
    c.beginPath()
    c.arc(0, 0.12, 0.2, 0, TAU)
    c.fillStyle = o.shade
    fs(c)
  },
  hat(c, o) {
    c.beginPath()
    c.moveTo(-0.52, 0.2)
    c.bezierCurveTo(-0.55, -0.9, 0.55, -0.9, 0.52, 0.2)
    c.closePath()
    fs(c)
    c.beginPath()
    c.moveTo(-0.88, 0.32)
    c.quadraticCurveTo(0, -0.12, 0.88, 0.32)
    c.quadraticCurveTo(0.8, 0.7, 0.5, 0.6)
    c.quadraticCurveTo(0, 0.3, -0.5, 0.6)
    c.quadraticCurveTo(-0.8, 0.7, -0.88, 0.32)
    c.closePath()
    fs(c)
  },
  candy(c, o) {
    c.save()
    c.rotate(-0.25)
    for (const d of [-1, 1]) {
      zigPoly(c, [[d * 0.36, -0.08], [d * 0.9, -0.5], [d * 0.9, 0.5], [d * 0.36, 0.08]], 3, d * 0.045)
      fs(c)
    }
    c.beginPath()
    c.ellipse(0, 0, 0.44, 0.36, 0, 0, TAU)
    fs(c)
    c.beginPath()
    c.ellipse(0, 0, 0.26, 0.2, 0, 0, TAU)
    c.fillStyle = o.shade
    fs(c)
    c.restore()
  },
  pouch(c, o) {
    c.beginPath()
    c.moveTo(-0.14, -0.22)
    c.bezierCurveTo(-0.95, 0.0, -0.8, 0.85, 0, 0.82)
    c.bezierCurveTo(0.8, 0.85, 0.95, 0.0, 0.14, -0.22)
    c.closePath()
    fs(c)
    c.beginPath()
    c.moveTo(-0.14, -0.2)
    const pts = [[-0.55, -0.6], [-0.3, -0.62], [-0.22, -0.88], [0, -0.66], [0.22, -0.88], [0.3, -0.62], [0.55, -0.6]]
    for (const [x, y] of pts) c.lineTo(x, y)
    c.lineTo(0.14, -0.2)
    c.closePath()
    fs(c)
    c.lineWidth = LW * 0.6
    for (const x of [-0.25, 0, 0.25]) line(c, [[x * 0.4, -0.15], [x, 0.3]])
  },
  plait(c, o) {
    c.save()
    c.rotate(-0.5)
    c.beginPath()
    c.moveTo(-0.92, 0)
    c.bezierCurveTo(-0.5, -0.7, 0.55, -0.75, 0.85, 0)
    c.bezierCurveTo(0.55, 0.75, -0.5, 0.7, -0.92, 0)
    c.closePath()
    fs(c)
    c.lineWidth = LW * 0.75
    for (let i = 0; i < 6; i++) {
      const x = -0.62 + i * 0.24
      line(c, [[x - 0.1, -0.16], [x + 0.06, 0], [x - 0.1, 0.16]])
    }
    c.restore()
  },
  triangle(c, o) {
    zigPoly(c, [[0, -0.85], [0.85, 0.65], [-0.85, 0.65]], 5, 0.055)
    fs(c)
    c.beginPath()
    c.moveTo(0, -0.3)
    c.lineTo(0.4, 0.4)
    c.lineTo(-0.4, 0.4)
    c.closePath()
    c.lineJoin = 'round'
    c.fillStyle = o.shade
    fs(c)
  },
  cannellone(c, o) {
    tube(c, o, { L: 0.56, r: 0.4, e: 0.15, rot: -0.3, end: '#b5533c' })
  },
  'pleated-dumpling'(c, o) {
    c.save()
    c.translate(0, 0.3)
    c.beginPath()
    c.moveTo(-0.88, 0)
    c.quadraticCurveTo(-0.8, 0.32, 0, 0.3)
    c.quadraticCurveTo(0.8, 0.32, 0.88, 0)
    scallop(c, 0, 0, 0.84, 12, 0.1, TAU, Math.PI, false)
    c.closePath()
    fs(c)
    c.lineWidth = LW * 0.65
    for (let i = 1; i < 6; i++) {
      const a = Math.PI + (i * Math.PI) / 6
      c.beginPath()
      c.moveTo(Math.cos(a) * 0.84, Math.sin(a) * 0.84)
      c.lineTo(Math.cos(a) * 0.5, Math.sin(a) * 0.5)
      c.stroke()
    }
    c.restore()
  },
  gnocco(c, o) {
    c.save()
    c.rotate(-0.4)
    c.beginPath()
    c.ellipse(0, 0, 0.8, 0.52, 0, 0, TAU)
    fs(c)
    c.lineWidth = LW * 0.7
    for (let i = -2; i <= 2; i++) {
      const x = i * 0.27
      const h = 0.5 * Math.sqrt(1 - (x / 0.8) ** 2)
      c.beginPath()
      c.moveTo(x - 0.05, -h)
      c.quadraticCurveTo(x + 0.12, 0, x - 0.05, h)
      c.stroke()
    }
    c.restore()
  },
  ball(c, o) {
    c.beginPath()
    c.arc(0, 0, 0.78, 0, TAU)
    fs(c)
    c.fillStyle = o.ink
    c.globalAlpha = 0.55
    for (const [x, y] of [[-0.3, -0.25], [0.25, -0.4], [0.4, 0.15], [-0.1, 0.35], [-0.45, 0.2], [0.05, -0.05]]) {
      c.beginPath()
      c.arc(x, y, 0.05, 0, TAU)
      c.fill()
    }
    c.globalAlpha = 1
  },
  squiggle(c, o) {
    const s = [
      [[-0.8, -0.5], [-0.5, -0.8], [-0.3, -0.3], [0.0, -0.55]],
      [[0.25, -0.7], [0.5, -0.4], [0.7, -0.75], [0.85, -0.35]],
      [[-0.75, 0.2], [-0.4, -0.05], [-0.2, 0.4], [0.15, 0.1]],
      [[0.35, 0.1], [0.55, 0.45], [0.75, 0.05], [0.85, 0.4]],
      [[-0.55, 0.75], [-0.2, 0.55], [0.1, 0.9], [0.45, 0.7]],
    ]
    for (const [a, b, d, e] of s)
      noodle(c, o, 0.15, (c) => {
        c.moveTo(a[0], a[1])
        c.bezierCurveTo(b[0], b[1], d[0], d[1], e[0], e[1])
      })
  },
}

export const GLYPHS = Object.keys(G)

function shadeOf(hex) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v) => Math.round(v * 0.74)
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}
const shadeCache = {}

/** Draw glyph `name` centred at (x, y), fitting a box of `size` pixels. */
export function drawGlyph(ctx, name, x, y, size, fill = '#edc55f', ink = '#4a3015') {
  const fn = G[name] || G.dots
  const o = { fill, ink, shade: (shadeCache[fill] ||= shadeOf(fill)) }
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 2, size / 2)
  ctx.lineWidth = LW
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.fillStyle = fill
  ctx.strokeStyle = ink
  fn(ctx, o)
  ctx.restore()
}
