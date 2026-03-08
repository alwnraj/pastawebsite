import { motion } from 'framer-motion'

function PastaCard({ pronunciation, icon, fact, isClosing = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{
        opacity: isClosing ? 0 : 1,
        y: isClosing ? 8 : 0,
        scale: isClosing ? 0.98 : 1,
      }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className="mt-4 rounded-[1.4rem] border border-[#eadbc9] bg-parchment/95 p-4 shadow-inner"
    >
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
    </motion.div>
  )
}

export default PastaCard
