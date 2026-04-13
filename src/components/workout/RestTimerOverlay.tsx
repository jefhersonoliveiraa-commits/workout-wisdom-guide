import { motion, AnimatePresence } from "framer-motion";

interface RestTimerOverlayProps {
  isRunning: boolean;
  seconds: number;
  totalSeconds: number;
  formatTime: (s: number) => string;
  onStop: () => void;
}

export function RestTimerOverlay({ isRunning, seconds, totalSeconds, formatTime, onStop }: RestTimerOverlayProps) {
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0;

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-[70px] left-4 right-4 z-[200] bg-bg3 border border-primary/30 rounded-lg p-4 shadow-[0_0_30px_rgba(200,245,100,0.15)]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">⏱ Descanso</span>
            <button
              onClick={onStop}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular ✕
            </button>
          </div>
          <div className="text-[32px] font-mono font-semibold text-foreground text-center mb-2">
            {formatTime(seconds)}
          </div>
          <div className="bg-bg4 rounded-[4px] h-[3px] overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-[4px]"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
