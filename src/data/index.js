import { FAMILY, MAKE, SUBS } from './taxonomy.js'

const files = import.meta.glob('./pasta/*.json', { eager: true, import: 'default' })

const seen = new Set()
export const PASTAS = []
for (const path of Object.keys(files).sort()) {
  for (const p of files[path]) {
    if (!p || !p.id || seen.has(p.id)) continue
    if (!FAMILY[p.family] || !MAKE[p.make] || !SUBS[p.sub]) continue
    seen.add(p.id)
    PASTAS.push({ aliases: [], pairings: [], ...p })
  }
}

export const PASTA = Object.fromEntries(PASTAS.map((p) => [p.id, p]))

const fold = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const index = PASTAS.map((p) => ({
  p,
  name: fold(p.name),
  aliases: (p.aliases || []).map(fold),
  rest: fold([p.country, p.region, p.meaning, FAMILY[p.family].label, SUBS[p.sub]].join(' ')),
}))

export function search(q, limit = 8) {
  q = fold(q).trim()
  if (!q) return []
  const out = []
  for (const e of index) {
    let score = 0
    if (e.name === q) score = 100
    else if (e.name.startsWith(q)) score = 80
    else if (e.name.includes(q)) score = 60
    else if (e.aliases.some((a) => a.startsWith(q))) score = 50
    else if (e.aliases.some((a) => a.includes(q))) score = 40
    else if (q.length > 2 && e.rest.includes(q)) score = 10
    if (score) out.push({ p: e.p, score, alias: score <= 50 && score >= 40 ? e.p.aliases.find((a) => fold(a).includes(q)) : null })
  }
  out.sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
  return out.slice(0, limit)
}
