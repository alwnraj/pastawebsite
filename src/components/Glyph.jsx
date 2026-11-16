import { useEffect, useRef } from 'react'
import { drawGlyph } from '../lib/glyphs.js'
import { MAKE } from '../data/taxonomy.js'

export default function Glyph({ pasta, size = 48, fill, ink }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = size * dpr
    c.height = size * dpr
    const ctx = c.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    drawGlyph(ctx, pasta.glyph, size / 2, size / 2, size * 0.86, fill || MAKE[pasta.make]?.fill, ink)
  }, [pasta, size, fill, ink])
  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden="true" />
}
