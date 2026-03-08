import { useEffect, useRef } from 'react'
import { Handle, Position, useUpdateNodeInternals } from 'reactflow'
import { AnimatePresence, motion } from 'framer-motion'
import PastaCard from './PastaCard'

const HANDLE_CLASSNAME =
  '!h-3 !w-3 !border-0 !bg-transparent !opacity-0'

function FlowHandles() {
  return (
    <>
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className={HANDLE_CLASSNAME}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        className={HANDLE_CLASSNAME}
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        className={HANDLE_CLASSNAME}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className={HANDLE_CLASSNAME}
      />
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className={HANDLE_CLASSNAME}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={HANDLE_CLASSNAME}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={HANDLE_CLASSNAME}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className={HANDLE_CLASSNAME}
      />
    </>
  )
}

function PastaNode({ id, data }) {
  const nodeRef = useRef(null)
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    const element = nodeRef.current

    if (!element) {
      return undefined
    }

    let frameId = null
    const syncHandles = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        updateNodeInternals(id)
      })
    }

    syncHandles()

    const resizeObserver = new ResizeObserver(() => {
      syncHandles()
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [id, updateNodeInternals, data.isDisplayedOpen, data.isClosing])

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <FlowHandles />

      <div
        className={`h-full w-full rounded-[1.7rem] border bg-white/95 p-4 shadow-lg transition-all duration-300 ${
          data.isActive
            ? 'border-terracotta/35 shadow-[0_30px_60px_-36px_rgba(184,92,56,0.8)]'
            : 'border-[#ecdcca]'
        }`}
      >
        <div className="nodrag w-full cursor-pointer text-left">
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
            <span>{data.isClosing ? 'Closing card' : data.isOpen ? 'Close card' : 'Open card'}</span>
            <span>{data.isDisplayedOpen ? '−' : '+'}</span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {data.isDisplayedOpen && (
            <PastaCard
              pronunciation={data.pronunciation}
              icon={data.icon}
              fact={data.fact}
              isClosing={data.isClosing}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default PastaNode
