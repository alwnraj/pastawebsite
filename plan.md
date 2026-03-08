# Pasta Mind Map — Project Plan

## Overview

An interactive, explorable mind map website that helps users discover and differentiate 40+ pasta types through a visually-driven decision tree. The experience starts with a single central node and expands outward as the user clicks — revealing branches, sub-branches, and finally individual pasta types. Each pasta endpoint reveals a small icon and one delightful factoid.

The goal is **curiosity, not comprehensiveness** — the user leaves wanting to look the pasta up themselves.

---

## Core Experience

- Single central node on load: **"What kind of pasta?"**
- User clicks a node → child nodes fan out from it
- User keeps clicking deeper → tree grows organically on screen
- Reaching a pasta endpoint → a small card blooms open showing:
  - Pasta name (with Italian pronunciation hint)
  - A simple illustrated icon or emoji representation
  - One surprising, shareable factoid
- Already-explored branches stay visible — by the end, the user has built up their own version of the full map
- User can collapse branches, reset, or re-explore freely

---

## Tech Stack

- **Framework**: React (Vite)
- **Mind map / graph rendering**: [React Flow](https://reactflow.dev/) — preferred for ease of use over D3
- **Layout algorithm**: [Dagre](https://github.com/dagrejs/dagre) — calculates node positions for tree layout (React Flow requires explicit `{x, y}` for each node)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion (node expansion/reveal animations)
- **Icons**: Custom SVG pasta illustrations or emoji fallbacks
- **Data**: All pasta data in a single structured JSON file
- **No backend required** — fully static site

---

## Data Structure

All pasta data lives in `/src/data/pastaTree.json`. The tree is a recursive node structure:

```json
{
  "id": "root",
  "label": "What kind of pasta?",
  "children": [
    {
      "id": "long",
      "label": "Long & thin",
      "children": [
        {
          "id": "long-hollow",
          "label": "Is it hollow?",
          "children": [
            {
              "id": "bucatini",
              "label": "Bucatini",
              "type": "pasta",
              "pronunciation": "boo-kah-TEE-nee",
              "icon": "🍝",
              "fact": "The hole running through the center isn't decorative — it helps the pasta cook evenly from the inside out, and traps sauce inside every strand."
            }
          ]
        },
        {
          "id": "long-solid",
          "label": "Is it solid?",
          "children": [...]
        }
      ]
    }
  ]
}
```

**Node types:**
- `"question"` — a branch/decision node (default if no type set)
- `"pasta"` — a leaf/endpoint node, has `pronunciation`, `icon`, and `fact`

---

## Tree Structure (40+ Pastas)

### Branch 1 — Long & Thin (strand pasta)
Questions: hollow or solid? thick or thin? very fine?
- Bucatini, Spaghetti, Spaghettini, Spaghettoni, Fedelini, Vermicelli, Capellini, Capellini d'angelo, Perciatelli

### Branch 2 — Long & Flat (ribbon pasta)
Questions: very wide? medium? narrow? wavy edge?
- Lasagne, Pappardelle, Tagliatelle, Tagliolini, Fettuccine, Linguine, Linguettine, Mafaldine

### Branch 3 — Short & Tubular
Questions: straight or angled cut? ridged or smooth? large or small?
- Penne, Penne rigate, Pennette, Rigatoni, Paccheri, Macaroni, Ziti, Cannelloni, Manicotti

### Branch 4 — Short & Twisted / Shaped
Questions: spiral? butterfly? wheel? ruffled?
- Fusilli, Fusilli bucati, Spirali, Rotelle, Farfalle, Trofie, Gemelli, Casarecce, Radiatori

### Branch 5 — Tiny / Miniature (pastina)
Questions: star-shaped? ring-shaped? bead-like? shell-like?
- Stelline, Anelli, Anellini, Acini di pepe, Orzo, Conchigliette, Farfalline, Ditalini, Pastina

### Branch 6 — Stuffed
Questions: round/ring shape? square/rectangular? large?
- Tortellini, Tortelloni, Ravioli, Agnolotti, Cappelletti, Sacchettini, Cannelloni (stuffed)

### Branch 7 — Dumpling-like / Irregular
Questions: potato-based? ricotta-based? baked?
- Gnocchi, Gnudi, Maltagliati, Orecchiette, Cavatelli

---

## Factoids (examples — build out all 40+)

| Pasta | Fact |
|-------|------|
| Bucatini | The hollow center cooks the pasta from inside out and traps sauce in every bite |
| Farfalle | Named "butterflies" in Italian, but Romans call them "bow ties" — two names, zero agreement |
| Penne | Named after the Italian word for quill pen, because of its diagonal cut |
| Orecchiette | Means "little ears" — traditionally rolled by hand with a thumb drag across a wooden board |
| Orzo | Despite looking like rice, it's 100% pasta — its name literally means "barley" |
| Capellini | So thin it cooks in under 2 minutes — the fastest pasta in the world |
| Gnocchi | Technically a dumpling, not a pasta — the great Italian debate |
| Radiatori | Shaped like old radiators in the 1960s, designed to trap as much sauce as possible |
| Tortellini | Legend says they were shaped by a Bolognese innkeeper modeling them after Venus's navel |
| Stelline | A staple of Italian children's soup — most Italians' first pasta memory |

---

## UI / Visual Design

- **Background**: Warm cream/parchment tone (evokes Italian trattoria)
- **Nodes**: Rounded pill shapes, warm orange/terracotta for questions, soft white for pasta endpoints
- **Typography**: Serif for pasta names (elegant), sans-serif for questions (clear)
- **Animations**:
  - Nodes fade + scale in when revealed
  - Endpoint card blooms open with a gentle spring animation
  - Edges draw themselves as connections appear
- **Canvas**: Pannable and zoomable — the full tree can be navigated freely
- **Mobile**: Pinch-to-zoom + drag supported. Consider a "focus mode" that auto-zooms to the current branch on small screens, plus an optional breadcrumb trail for orientation when deeply nested.

---

## Key Components

```
/src
  /components
    MindMap.jsx          # Main canvas — renders React Flow graph
    QuestionNode.jsx     # Branch node UI
    PastaNode.jsx        # Leaf node UI (with expand-to-card behavior)
    PastaCard.jsx        # The factoid card that blooms on click
    ResetButton.jsx      # Resets the map to root only
  /data
    pastaTree.json       # Full recursive tree data
  /hooks
    useTreeExpansion.js  # Manages which nodes are currently visible
    useLayoutNodes.js    # Computes node positions using Dagre
  App.jsx
  main.jsx
```

---

## Interaction Rules

1. On load: only the root node is visible (with a gentle fade-in to prevent React Flow flash)
2. Clicking a **question node** → reveals its immediate children (one level at a time)
3. Clicking a **pasta node** → opens the `PastaCard` overlay in place
4. Clicking an already-open pasta node → closes the card
5. Clicking an already-expanded question node → collapses that branch and **all direct descendants only** (sibling branches remain open)
6. A **Reset** button in the corner collapses everything back to root
7. The canvas auto-pans/zooms to fit newly revealed nodes

**Edge rendering**: Use `smoothstep` edge type to avoid harsh angles. If edge crossings become problematic with many branches open, consider `elkjs` for smarter routing.

---

## File Structure

```
pasta-mindmap/
├── public/
├── src/
│   ├── components/
│   │   ├── MindMap.jsx
│   │   ├── QuestionNode.jsx
│   │   ├── PastaNode.jsx
│   │   ├── PastaCard.jsx
│   │   └── ResetButton.jsx
│   ├── data/
│   │   └── pastaTree.json
│   ├── hooks/
│   │   ├── useTreeExpansion.js
│   │   └── useLayoutNodes.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Dependencies

```json
{
  "react": "^18",
  "react-dom": "^18",
  "reactflow": "^11",
  "dagre": "^0.8",
  "framer-motion": "^11",
  "tailwindcss": "^3",
  "vite": "^5"
}
```

---

## What to Build First (suggested order)

1. Scaffold Vite + React + Tailwind project
2. Build `pastaTree.json` with **~20 pastas** first (ship faster, expand later)
3. Implement `useTreeExpansion` hook — manages visible node state
4. Build `useLayoutNodes` hook — uses Dagre to compute `{x, y}` positions from visible tree state
5. Build basic `MindMap.jsx` with React Flow rendering root node only
6. Add `QuestionNode` click → expand children behavior
7. Add `PastaNode` click → open `PastaCard`
8. Style nodes and card to match warm Italian aesthetic
9. Add Framer Motion animations for node reveal
10. Add pan/zoom/reset behavior
11. Polish: typography, colors, mobile touch support
12. Expand to full 40+ pastas

---

## Out of Scope (for now)

- Real pasta photography (use illustrated icons or emoji)
- Backend / database
- User accounts or saved progress
- Search functionality
- Multilingual support