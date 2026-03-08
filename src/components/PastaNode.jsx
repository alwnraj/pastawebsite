import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'
import PastaCard from './PastaCard'

function PastaNode({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-parchment !bg-[#d88c3f]"
      />

      <div className="h-full w-full rounded-[1.7rem] border border-[#ecdcca] bg-white/95 p-4 shadow-lg">
        <div className="nodrag nopan w-full cursor-pointer text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-olive/70">
                Pasta
              </p>
              <h3 className="mt-2 font-display text-2xl leading-none text-espresso">
                {data.label}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5e6d2] text-2xl">
              <span aria-hidden="true">{data.icon}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-olive/65">
            <span>{data.isOpen ? 'Close card' : 'Open card'}</span>
            <span>{data.isOpen ? '−' : '+'}</span>
          </div>
        </div>

        {data.isOpen && (
          <PastaCard
            pronunciation={data.pronunciation}
            icon={data.icon}
            fact={data.fact}
          />
        )}
      </div>
    </motion.div>
  )
}

export default PastaNode
