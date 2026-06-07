import { useState, useEffect, useRef } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const WORK = 25 * 60;
const BREAK = 5 * 60;

interface PomodoroWidgetProps {
  open: boolean;
  onClose: () => void;
}

const PomodoroWidget = ({ open, onClose }: PomodoroWidgetProps) => {
  const [seconds, setSeconds] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          const nextMode = mode === "work" ? "break" : "work";
          toast.success(mode === "work" ? "Break time! ☕" : "Back to focus! 🍅");
          setMode(nextMode);
          return nextMode === "work" ? WORK : BREAK;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  const reset = () => {
    setRunning(false);
    setMode("work");
    setSeconds(WORK);
  };

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-12 right-4 z-50 bg-card border border-border rounded-xl shadow-2xl p-4 w-56 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Timer className="w-3.5 h-3.5 text-primary" />
              Pomodoro
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
              ✕
            </button>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-mono font-bold tabular-nums ${mode === "work" ? "text-primary" : "text-green-400"}`}>
              {mins}:{secs}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              {mode === "work" ? "Focus" : "Break"}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 text-xs font-medium"
            >
              {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PomodoroWidget;
