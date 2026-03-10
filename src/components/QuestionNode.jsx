import { Handle, Position } from "reactflow";
import { motion } from "framer-motion";

const HANDLE_CLASSNAME = "!h-3 !w-3 !border-0 !bg-transparent !opacity-0";

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
  );
}

function QuestionNode({ data }) {
  const helperCopy = data.isExpanded ? "Hide branch" : "Reveal options";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <FlowHandles />

      <div
        role="button"
        tabIndex={0}
        aria-expanded={data.isExpanded}
        aria-label={`${data.label} — ${data.isExpanded ? "collapse" : "expand"} branch (${data.childCount} options)`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            data.onToggle();
          }
        }}
        className={`nodrag flex h-full w-full min-w-[10rem] cursor-pointer flex-col justify-between rounded-[1.7rem] border px-5 py-4 text-left shadow-lg transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 ${
          data.isRoot
            ? "border-olive/20 bg-[linear-gradient(135deg,_rgba(82,101,67,0.95),_rgba(91,123,75,0.92))] text-white shadow-[0_28px_60px_-32px_rgba(82,101,67,0.75)]"
            : "border-terracotta/10 bg-[linear-gradient(135deg,_rgba(184,92,56,0.96),_rgba(221,143,62,0.92))] text-white shadow-[0_24px_52px_-30px_rgba(184,92,56,0.7)]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/70">
              {data.isRoot ? "Start here" : "Question"}
            </p>
            <p className="mt-2 break-words text-lg font-semibold leading-6">
              {data.label}
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded-full border border-white/25 bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            {data.childCount}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/70">
          <span>{helperCopy}</span>
          <span>{data.isExpanded ? "−" : "+"}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default QuestionNode;
