# Pasta Mind Map — Improvement Instructions

These are three distinct, independent improvements to make to the existing site. Each can be tackled separately.

---

## Improvement 1 — Move root node to center, branches radiate outward

**The problem:**
The root node ("What kind of pasta?") currently sits in the bottom-left corner. Users look at the center of the screen first and feel briefly lost. The "mind map" metaphor only works if the tree grows outward from a true center point.

**What to change:**
- Reposition the root node to the center of the canvas on load
- Child branches should spread outward in all directions (not just left-to-right)
- The initial viewport should be centered on the root node when the page loads
- As the user expands branches, the canvas should pan/zoom to keep the newly revealed nodes comfortably in view
- The overall layout algorithm should treat the root as the origin point, distributing branches radially (e.g. top-left, top-right, bottom-left, bottom-right, left, right) rather than always flowing to the right

**Acceptance criteria:**
- On load, root node is centered on screen
- First-level branches fan out in multiple directions, not just one
- No branch should feel "behind" the user — everything expands away from center

---

## Improvement 2 — Only one pasta card open at a time

**The problem:**
Multiple pasta endpoint cards can be open simultaneously, causing them to overlap and crowd the canvas. It becomes visually noisy and hard to read quickly.

**What to change:**
- Only one pasta card should be open at any time
- When the user clicks a new pasta node, any currently open card should close first, then the new card opens
- The canvas should smoothly pan to center the newly opened card in the viewport
- The close behavior should feel intentional — a quick fade-out of the old card before the new one appears, not an abrupt swap

**Acceptance criteria:**
- Clicking pasta A opens its card
- Clicking pasta B while A is open: A closes, B opens
- Clicking the same pasta again closes its card
- Canvas re-centers on the active card each time

---

## Improvement 3 — Make connecting lines more readable

**The problem:**
The dashed lines connecting nodes are thin and visually easy to lose, especially when many branches are expanded. It's hard to trace a path from root to endpoint at a glance.

**What to change:**
- Increase line thickness slightly (try 2px as a baseline, currently feels like 1px)
- Differentiate between **explored** and **unexplored** branches visually:
  - Explored edges (leading to expanded nodes): use the terracotta/orange color from the node palette, full opacity
  - Unexplored edges (leading to collapsed or unvisited nodes): lighter, more muted tone (e.g. warm gray or low-opacity terracotta)
- Keep the dashed style for question-to-question edges if desired, but use a solid line for question-to-pasta (endpoint) edges to signal "this is a destination"
- On hover over any node, subtly highlight the full path of edges leading back to the root (breadcrumb trail effect)

**Acceptance criteria:**
- Lines are visibly thicker and easier to follow
- Explored vs unexplored branches are visually distinct at a glance
- Endpoint edges look different from question edges
- Hovering a node highlights its ancestry path back to root
