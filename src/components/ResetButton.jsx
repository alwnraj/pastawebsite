import { useEffect, useRef, useState } from "react";

const DISARM_DELAY_MS = 2500;

function ResetButton({ onReset }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef(null);

  function clearDisarmTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handleClick() {
    if (confirming) {
      clearDisarmTimer();
      setConfirming(false);
      onReset();
      return;
    }

    setConfirming(true);
    timerRef.current = window.setTimeout(() => {
      setConfirming(false);
      timerRef.current = null;
    }, DISARM_DELAY_MS);
  }

  function handleBlur() {
    if (confirming) {
      clearDisarmTimer();
      setConfirming(false);
    }
  }

  useEffect(() => {
    return () => clearDisarmTimer();
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={handleBlur}
      aria-label={
        confirming ? "Click again to confirm reset" : "Reset the pasta map"
      }
      className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-lg transition-all duration-200 ${
        confirming
          ? "scale-105 border-terracotta/40 bg-terracotta text-white shadow-terracotta/25"
          : "border-terracotta/15 bg-white/90 text-terracotta hover:bg-white"
      }`}
    >
      {confirming ? "Confirm reset?" : "Reset map"}
    </button>
  );
}

export default ResetButton;
