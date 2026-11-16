# The Atlas of Pasta

A zoomable, branching map of 292 pasta shapes, from Italy and the pasta traditions around it. Zoom out to see the great families; zoom in until every shape has a drawing, a name, a hometown and a story.

## What you can do

- **Zoom and wander.** Scroll to zoom, drag to pan, double-click to zoom in. Far out you see territories and families; closer in, sub-families; closer still, every shape drawn and labelled.
- **Rearrange the whole map** by **Shape** (10 families), **Origin** (Italian regions and the rest of the world) or **Dough** (dried durum, fresh egg, potato, buckwheat…). Shapes fly to their new branches.
- **Click any shape** for its pronunciation, what the name means, what it looks like, where it is from, what it is made of, classic pairings and its neighbours.
- **Search** by name, alias, meaning or place (press `/`).
- **Guided tour** walks through each territory in turn; **Surprise me** jumps to a random shape.
- Links are shareable: `#/origin/orecchiette` opens that shape in that arrangement.

Keys: `/` search · `0` whole map · `+` `-` zoom · `←` `→` previous / next neighbour or tour stop · `Esc` close.

## Run it

```bash
npm install
npm run dev
```

`npm run build` writes a static site to `dist/` (Vercel config included).

## How it is built

- React + Vite. The map is a single `<canvas>` drawn by `src/lib/atlas.js` (camera, hit-testing, level-of-detail, transitions) using a radial layout from `src/lib/layout.js`.
- `src/lib/glyphs.js` draws ~55 pasta archetypes as vectors, so every shape stays sharp at any zoom. Fill colour encodes the dough.
- Data is a flat list in `src/data/pasta/*.json`; `src/data/taxonomy.js` defines the families, regions, doughs and the three "lenses" that regroup it.

## Adding a pasta

Add a record to any file in `src/data/pasta/`:

```json
{
  "id": "penne-rigate", "name": "Penne rigate", "aliases": [],
  "family": "tubes", "sub": "tubes-diagonal", "glyph": "penne-ridged",
  "region": "italy", "country": null, "make": "dried",
  "pron": "PEN-neh ree-GAH-teh", "meaning": "ridged quills",
  "look": "Short tube cut on the diagonal, ridged outside.",
  "fact": "…", "pairings": ["arrabbiata"]
}
```

`family`, `sub`, `region` and `make` must be ids from `taxonomy.js`; `glyph` must be one drawn in `glyphs.js`. For non-Italian shapes use `"region": "world"` plus a `country`.

## A note on completeness

Nobody has a full census of pasta: names change from one valley to the next, and one shape can have a dozen. The atlas folds synonyms into `aliases` and aims for breadth, not a claim to list every shape. Descriptions were written from general knowledge and have not been individually fact-checked against sources.
