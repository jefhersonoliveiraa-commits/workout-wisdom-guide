import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Exercise } from "@/data/workoutData";
import { getLatestWeight, saveWeight } from "@/lib/storage";

interface ExerciseCardProps {
  exercise: Exercise;
  setsCompleted: boolean[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleSet: (setIndex: number) => void;
  onToggleAll: () => void;
  onSetComplete: (restSeconds: number) => void;
}

export function ExerciseCard({
  exercise,
  setsCompleted,
  isOpen,
  onToggleOpen,
  onToggleSet,
  onToggleAll,
  onSetComplete,
}: ExerciseCardProps) {
  const allDone = setsCompleted.length >= exercise.sets && setsCompleted.every(Boolean);
  const sets = setsCompleted.length >= exercise.sets
    ? setsCompleted
    : [...setsCompleted, ...Array(exercise.sets - setsCompleted.length).fill(false)];

  const restSeconds = parseInt(exercise.rest) || 60;

  const latest = getLatestWeight(exercise.id);
  const [weightInput, setWeightInput] = useState(latest?.weight?.toString() || "");
  const [showWeightSaved, setShowWeightSaved] = useState(false);

  const handleSaveWeight = () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;
    saveWeight({
      exerciseId: exercise.id,
      weight: w,
      unit: "kg",
      reps: exercise.reps,
      date: new Date().toISOString().split("T")[0],
    });
    setShowWeightSaved(true);
    setTimeout(() => setShowWeightSaved(false), 1500);
  };

  return (
    <div className="bg-bg2 border border-border rounded-lg mb-[10px] overflow-hidden">
      <div
        className="flex items-center gap-3 p-[14px] cursor-pointer"
        onClick={onToggleOpen}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggleAll(); }}
          className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
            allDone
              ? "bg-primary border-primary"
              : "border-border-bright bg-transparent"
          }`}
        >
          {allDone && <span className="text-[12px] text-primary-foreground font-bold">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-foreground leading-tight">{exercise.name}</div>
          <div className="text-[11px] text-muted-foreground mt-[2px]">{exercise.muscle}</div>
        </div>
        {latest && (
          <span className="text-[11px] font-mono text-primary/70 flex-shrink-0">{latest.weight}kg</span>
        )}
        <div className={`text-muted-foreground text-[16px] flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▾
        </div>
      </div>

      <div className="flex gap-[6px] flex-wrap px-[14px] pb-[10px] pl-[48px]">
        <span className="text-[11px] font-mono bg-bg4 border border-border rounded-[6px] px-2 py-[3px] text-muted-foreground">
          {exercise.sets} × {exercise.reps} reps
        </span>
        <span className="text-[11px] font-mono bg-bg4 border border-border rounded-[6px] px-2 py-[3px] text-muted-foreground">
          {exercise.rest} descanso
        </span>
        {exercise.rpe && (
          <span className="text-[11px] font-mono bg-bg4 border border-border rounded-[6px] px-2 py-[3px] text-muted-foreground">
            {exercise.rpe}
          </span>
        )}
        {exercise.warnings.map((w, i) => (
          <span
            key={i}
            className="text-[11px] font-mono rounded-[6px] px-2 py-[3px] border border-workout-red/40 text-workout-red bg-workout-red/[0.08]"
          >
            {w}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-[14px] pb-[14px] border-t border-border mt-1 pt-3">
              <p className="text-[13px] text-muted-foreground leading-[1.7]">{exercise.description}</p>

              {/* Weight input */}
              <div className="flex items-center gap-2 mt-3 bg-bg4 rounded-sm p-2">
                <span className="text-[11px] text-muted-foreground">Carga:</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="0"
                  className="w-16 bg-bg3 border border-border rounded-[6px] px-2 py-1 text-[14px] font-mono text-foreground text-center outline-none focus:border-primary transition-colors"
                />
                <span className="text-[11px] text-muted-foreground">kg</span>
                <button
                  onClick={handleSaveWeight}
                  className="ml-auto text-[11px] bg-primary/20 text-primary border border-primary/30 rounded-[6px] px-3 py-1 font-medium transition-colors hover:bg-primary/30"
                >
                  {showWeightSaved ? "✓ Salvo" : "Salvar"}
                </button>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-[6px] mt-3">
                {sets.map((done, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onToggleSet(idx);
                      if (!done) onSetComplete(restSeconds);
                    }}
                    className={`rounded-sm p-2 text-center text-[11px] cursor-pointer transition-all duration-150 border ${
                      done
                        ? "bg-primary/[0.12] border-primary/30"
                        : "bg-bg4 border-border"
                    }`}
                  >
                    <span className={`block text-[15px] font-semibold font-mono ${done ? "text-primary" : "text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                    <span className={done ? "text-primary/60" : "text-muted-foreground"}>Série</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
