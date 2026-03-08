function PastaCard({ pronunciation, icon, fact }) {
  return (
    <div className="mt-4 rounded-[1.4rem] border border-[#eadbc9] bg-parchment/95 p-4 shadow-inner">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1dfca] text-2xl">
          <span aria-hidden="true">{icon}</span>
        </div>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-terracotta/80">
            Pronunciation
          </p>
          <p className="mt-1 text-sm font-semibold text-espresso">
            {pronunciation}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-espresso/75">{fact}</p>
    </div>
  )
}

export default PastaCard
