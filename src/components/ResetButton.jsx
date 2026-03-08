function ResetButton({ onReset }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="rounded-full border border-terracotta/15 bg-white/90 px-4 py-2 text-sm font-semibold text-terracotta shadow-lg transition-colors hover:bg-white"
    >
      Reset map
    </button>
  )
}

export default ResetButton
