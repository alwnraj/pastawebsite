import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'

function QuestionNode({ data }) {
  const helperCopy = data.isExpanded ? 'Hide branch' : 'Reveal options'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {!data.isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-parchment !bg-terracotta"
        />
      )}

      <div
        className={`nodrag nopan h-full w-full cursor-pointer rounded-[1.7rem] border px-5 py-4 text-left shadow-lg transition-transform duration-300 hover:-translate-y-0.5 ${
          data.isRoot
            ? 'border-olive/20 bg-[linear-gradient(135deg,_rgba(82,101,67,0.95),_rgba(91,123,75,0.92))] text-white'
            : 'border-terracotta/10 bg-[linear-gradient(135deg,_rgba(184,92,56,0.96),_rgba(221,143,62,0.92))] text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/70">
              {data.isRoot ? 'Start here' : 'Question'}
            </p>
            <p className="mt-2 text-lg font-semibold leading-6">{data.label}</p>
          </div>
          <span className="mt-1 rounded-full border border-white/25 bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            {data.childCount}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/70">
          <span>{helperCopy}</span>
          <span>{data.isExpanded ? '−' : '+'}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!h-3 !w-3 !border-2 !border-parchment ${
          data.isRoot ? '!bg-olive' : '!bg-saffron'
        }`}
      />
    </motion.div>
  )
}

export default QuestionNode
