import MindMap from "./components/MindMap";
import ResetButton from "./components/ResetButton";
import TouchHint from "./components/TouchHint";
import pastaTree from "./data/pastaTree.json";
import { useTreeExpansion } from "./hooks/useTreeExpansion";

function App() {
  const {
    treeIndex,
    visibleNodeIds,
    expandedQuestionIds,
    openPastaIds,
    activePastaId,
    closingPastaId,
    focusRequest,
    totalPastas,
    discoveredCount,
    toggleQuestionNode,
    togglePastaNode,
    resetTree,
  } = useTreeExpansion(pastaTree);

  return (
    <main className="min-h-screen overflow-hidden bg-cream text-espresso">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,248,239,0.9),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(221,143,62,0.24),_transparent_30%),linear-gradient(140deg,_rgba(184,92,56,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,_rgba(255,255,255,0.58),_transparent)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-parchment/80 px-6 py-6 shadow-card backdrop-blur sm:px-8">
          <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-saffron/20 blur-2xl" />
          <div className="absolute bottom-0 left-8 h-20 w-20 rounded-full bg-terracotta/15 blur-2xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full border border-terracotta/20 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">
                Interactive Pasta Atlas
              </p>
              <h1 className="font-display text-4xl leading-none text-espresso sm:text-5xl">
                Build your own pasta map.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-espresso/75 sm:text-base">
                Start at the center, reveal branches one question at a time, and
                open any pasta endpoint for a quick pronunciation guide and a
                fact worth repeating at dinner.
              </p>
            </div>

            <div className="flex min-w-[17rem] flex-col gap-3 rounded-2xl border border-olive/10 bg-white/80 px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-olive/70">
                    Discovered
                  </p>
                  <p className="mt-0.5 font-display text-2xl leading-none text-olive">
                    {discoveredCount}
                    <span className="ml-1 text-sm font-normal text-olive/50">
                      / {totalPastas}
                    </span>
                  </p>
                </div>
                <div className="h-10 w-px bg-olive/15" />
                <div className="max-w-[12rem] text-xs leading-5 text-espresso/70">
                  Tap question nodes to expand branches. Open pasta cards to
                  discover.
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-olive/10">
                <div
                  className="h-full rounded-full bg-olive transition-all duration-500 ease-out"
                  style={{
                    width:
                      totalPastas > 0
                        ? `${Math.round((discoveredCount / totalPastas) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <section className="relative mt-6 h-[72vh] min-h-[540px] flex-1 overflow-hidden rounded-[2rem] border border-white/70 bg-[#fbf5ec]/85 shadow-card backdrop-blur sm:min-h-[620px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.78),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.28),_rgba(246,239,228,0.28))]" />
          <div className="absolute right-4 top-4 z-10">
            <ResetButton onReset={resetTree} />
          </div>
          <TouchHint />
          <MindMap
            tree={pastaTree}
            treeIndex={treeIndex}
            visibleNodeIds={visibleNodeIds}
            expandedQuestionIds={expandedQuestionIds}
            openPastaIds={openPastaIds}
            activePastaId={activePastaId}
            closingPastaId={closingPastaId}
            focusRequest={focusRequest}
            onQuestionToggle={toggleQuestionNode}
            onPastaToggle={togglePastaNode}
          />
        </section>
      </div>
    </main>
  );
}

export default App;
