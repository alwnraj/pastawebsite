# Session Handoff

## Branch And Repo

- Repo: `https://github.com/alwnraj/pastawebsite.git`
- Current branch: `expanded-pasta-map`
- `main` is still the original baseline (`fd0b7da`) and the branch contains the expanded interactive version.
- The main branch currently represents the simpler/original build with the 54-pasta dataset.
- This branch contains the expanded dataset, interaction work, and the later layout/edge refinements.

## What Has Been Built

The project was built from `plan.md` into a Vite + React + React Flow pasta decision-tree app, then extended with the work requested in `improvements.md` and `additions.md`.

Core implementation areas:

- App shell: `src/App.jsx`
- Canvas / viewport orchestration: `src/components/MindMap.jsx`
- Question nodes: `src/components/QuestionNode.jsx`
- Pasta nodes and dynamic connector updates: `src/components/PastaNode.jsx`
- Optional pasta card view: `src/components/PastaCard.jsx`
- Expansion state / selection logic: `src/hooks/useTreeExpansion.js`
- Layout and edge styling: `src/hooks/useLayoutNodes.js`
- Dataset: `src/data/pastaTree.json`
- Visual styling: `src/index.css`

Supporting project setup already exists:

- Vercel config: `vercel.json`
- Readme: `README.md`
- GitHub repo already created and pushed

## Major Changes Since The Original Build

### Data / Tree

- Expanded the pasta dataset from 54 to 82 entries.
- Added the `Is it hand-shaped?` top-level branch.
- Preserved existing pasta IDs.
- Kept `cannelloni` to a single entry.

### Interaction

- Root loads centered.
- Top-level branches expand radially from the root.
- `Reset map` collapses back to the root state.
- Hovering a node highlights its ancestry path back to the root.
- Only one pasta card can be open at a time.
- Card switching uses a close-then-open transition.
- Pasta card focus no longer fights the user’s zoom level.
- Free panning works even when dragging on or near node/card content.
- Minimum zoom was lowered so the user can zoom farther out.
- Branch clicks now use a middle-ground focus:
  - the viewport recenters around the clicked question and its immediate visible children
  - it no longer aggressively fits the entire map on every branch expansion

### Layout

- First-level branch distribution was reworked to make the overall tree read more like a radial map.
- The `long-thin` branch gets extra spacing so top endpoint pasta cards do not collapse into a tight ribbon.
- `stuffed` and `tiny-miniature` were pushed to spread more diagonally.
- The later balancing pass redistributed top-level angles again so the map is less left-heavy and the root stays visually centered in the overall shape.
- Downward reach is now clamped so bottom branches fan outward instead of drooping excessively.
- Question nodes size to fit their text better and longer labels wrap instead of clipping.

### Edge Styling

- Red connector styling was removed.
- Question-to-question edges are dashed warm-toned connectors.
- Question-to-pasta edges are solid warm-toned connectors.
- Explored vs unexplored state is conveyed primarily through opacity.
- Hovering a node brightens the full ancestry path to the root.
- Pasta node connector geometry is refreshed on card open/close so edges stay attached correctly.

## Current Working Tree Before This Handoff Commit

These files had local modifications beyond the last branch commit and are intended to be part of the branch state:

- `src/components/MindMap.jsx`
- `src/components/PastaNode.jsx`
- `src/components/QuestionNode.jsx`
- `src/hooks/useLayoutNodes.js`
- `src/hooks/useTreeExpansion.js`

Those changes cover the recent interaction/layout fixes:

- stop forced zoom-outs on branch expansion
- branch-local focus behavior
- freer pan/zoom after opening cards
- connector reattachment on expanding/collapsing pasta cards
- wider zoom-out range
- top-branch uncrowding
- overall radial balancing
- delicate dashed connector restoration

## Important Layout Knobs

Most future tuning will happen in `src/hooks/useLayoutNodes.js`.

Key controls there include:

- `ROOT_BRANCH_ANGLE_HINTS`
- branch-specific spacing / spread overrides
- vertical reach clamp for bottom-facing branches
- post-layout balancing around the root
- connector stroke colors, opacities, dash pattern, and stroke width

For interaction behavior, the main control points are:

- `src/components/MindMap.jsx`
- `src/hooks/useTreeExpansion.js`

## Verification Already Performed

Repeatedly verified with:

- `npm run build`
- live browser checks using Playwright against a local Vite dev server

Verified behaviors during the session:

- root centering on load
- branch drilling and reset behavior
- single-open pasta card behavior
- viewport no longer snapping back after user zoom changes
- panning directly on open cards
- connector line staying attached after card open/close
- improved spacing on dense branches
- balanced full-tree silhouette after expansion
- warm dashed/solid connector styling with no red

## Known Notes

- Build passes.
- Vite still reports a non-blocking chunk-size warning for the main JS bundle.
- The branch intentionally diverges from `main`; if the user later wants the simpler 54-pasta version preserved untouched, keep `main` as the fallback and continue experimental work on this branch or a child branch.

## Git Context

- Branch head before this handoff commit: `ff65873` (`Expand pasta map and interaction flow`)
- `main` / `origin/main` currently point to `fd0b7da` (`Initial commit`)

## What The Next Agent Should Know

- Do not change the pasta facts or tree structure unless the user explicitly asks. Recent requests were layout/interaction only.
- `src/hooks/useLayoutNodes.js` is now the most sensitive file in the repo; small spacing or angle changes can affect the whole map.
- The user strongly dislikes viewport behavior that feels like the site is fighting them. Preserve user-controlled pan/zoom whenever possible.
- When checking layout fixes, use a real browser and expand multiple top-level branches. Static code inspection is not enough for this app.
- If further visual tuning is requested, compare against the right-side branches as the current aesthetic benchmark because the user explicitly referenced them.
- If branching strategy comes up again:
  - `main` should remain the original/simple version
  - `expanded-pasta-map` is the experimental / expanded branch

