import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const HINT_VISIBLE_MS = 3800;

function TouchHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isTouchDevice =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (!isTouchDevice) return;

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, HINT_VISIBLE_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-espresso/75 px-4 py-2 text-xs font-medium tracking-wide text-white/90 shadow-lg backdrop-blur-sm"
        >
          Pinch to zoom&nbsp;&nbsp;·&nbsp;&nbsp;Drag to pan
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TouchHint;
