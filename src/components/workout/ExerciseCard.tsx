import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Exercise } from "@/data/workoutData";
import { getTodaySession, getLastSession, saveSet, type SetLog } from "@/lib/storage";

interface ExerciseCardProps {
  exercise: Exercise;
  setsCompleted: boolean[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleSet: (setIndex: number) => void;
  onToggleAll: () => void;
  onSetComplete: (restSeconds: number) => void;
}

interface SetInput {
  weight: string;
  reps: string;
}

function parseRest(rest: string): number {
  // "3 min", "1,5 min", "90s", "2,5 min", "3–4 min"
  const lower = rest.toLowerCase();
  if (lower.includes("min")) {
    const m = lower.match(/([\d,]+)/);
    if (m) return Math.round(parseFloat(m[1].replace(",", ".")) * 60);
  }
  const s = lower.match(/(\d+)\s*s/);
  if (s) return parseInt(s[1]);
  return 90;
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

  const restSeconds = parseRest(exercise.rest);

  // Inicializa inputs a partir da sessão de hoje OU da última sessão (sugestão)
  const [inputs, setInputs] = useState<SetInput[]>(() => {
    const today = getTodaySession(exercise.id);
    const last = today ?? getLastSession(exercise.id);
    return Array.from({ length: exercise.sets }, (_, i) => {
      const s = last?.sets[i];
      return {
        weight: s && s.weight > 0 ? String(s.weight) : "",
        reps: s && s.reps > 0 ? String(s.reps) : "",
      };
    });
  });

  // Sincroniza se a quantidade de sets mudar
  useEffect(() => {
    setInputs(prev => {
      if (prev.length === exercise.sets) return prev;
      const next = [...prev];
      while (next.length < exercise.sets) next.push({ weight: "", reps: "" });
      return next.slice(0, exercise.sets);
    });
  }, [exercise.sets]);

  const lastSession = getLastSession(exercise.id);
  const todayTopWeight = (() => {
    const today = getTodaySession(exercise.id);
    const valid = today?.sets.filter(s => s.weight > 0) || [];
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => (b.weight > a.weight ? b : a)).weight;
  })();

  const updateInput = (idx: number, field: keyof SetInput, value: string) => {
    setInputs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const persistSet = (idx: number): SetLog | null => {
    const w = parseFloat(inputs[idx].weight.replace(",", "."));
    const r = parseInt(inputs[idx].reps);
    if (!isNaN(w) && w > 0 && !isNaN(r) && r > 0) {
      const log = { weight: w, reps: r };
      saveSet(exercise.id, idx, log);
      return log;
    }
    return null;
  };

  const handleSetClick = (idx: number, done: boolean) => {
    if (!done) {
      persistSet(idx);
      onSetComplete(restSeconds);
    }
    onToggleSet(idx);
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
        {todayTopWeight !== null ? (
          <span className="text-[11px] font-mono text-primary flex-shrink-0">{todayTopWeight}kg</span>
        ) : lastSession ? (
          <span className="text-[10px] font-mono text-muted-foreground/70 flex-shrink-0">
            últ. {lastSession.sets.find(s => s.weight > 0)?.weight ?? "—"}kg
          </span>
        ) : null}
        <div className={`text-muted-foreground text-[16px] flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▾
        </div>
      </div>

      <div className="flex gap-[6px] flex-wrap px-[14px] pb-[10px] pl-[48px]">
        <span className="text-[11px] font-mono bg-bg4 border border-border rounded-[6px] px-2 py-[3px] text-muted-foreground">
          {exercise.sets} × {exercise.reps}
        </span>
        <span className="text-[11px] font-mono bg-bg4 border border-border rounded-[6px] px-2 py-[3px] text-muted-foreground">
          ⏱ {exercise.rest}
        </span>
        {exercise.rir && (
          <span className="text-[11px] font-mono bg-bg4 border border-border rounded-[6px] px-2 py-[3px] text-muted-foreground">
            {exercise.rir}
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

              {exercise.technique && (
                <div className="mt-3 bg-primary/[0.08] border border-primary/30 rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                    🔥 Técnica avançada
                  </div>
                  <div className="text-[12px] text-primary/90 leading-[1.6]">{exercise.technique}</div>
                </div>
              )}

              {/* Header das colunas */}
              <div className="grid grid-cols-[44px_1fr_1fr_44px] gap-2 mt-4 px-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sér.</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Carga (kg)</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Reps</div>
                <div></div>
              </div>

              {/* Linhas por série */}
              <div className="space-y-2 mt-2">
                {sets.map((done, idx) => {
                  const lastSet = lastSession?.sets[idx];
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[44px_1fr_1fr_44px] gap-2 items-center bg-bg4 border rounded-sm p-2 transition-colors ${
                        done ? "border-primary/40 bg-primary/[0.06]" : "border-border"
                      }`}
                    >
                      <div className={`text-center text-[14px] font-mono font-semibold ${done ? "text-primary" : "text-muted-foreground"}`}>
                        {idx + 1}
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={inputs[idx]?.weight || ""}
                        onChange={(e) => updateInput(idx, "weight", e.target.value)}
                        onBlur={() => persistSet(idx)}
                        placeholder={lastSet?.weight ? String(lastSet.weight) : "0"}
                        className="w-full bg-bg3 border border-border rounded-[6px] px-2 py-1 text-[14px] font-mono text-foreground text-center outline-none focus:border-primary transition-colors"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={inputs[idx]?.reps || ""}
                        onChange={(e) => updateInput(idx, "reps", e.target.value)}
                        onBlur={() => persistSet(idx)}
                        placeholder={lastSet?.reps ? String(lastSet.reps) : "0"}
                        className="w-full bg-bg3 border border-border rounded-[6px] px-2 py-1 text-[14px] font-mono text-foreground text-center outline-none focus:border-primary transition-colors"
                      />
                      <button
                        onClick={() => handleSetClick(idx, done)}
                        className={`w-full h-8 rounded-[6px] text-[12px] font-bold transition-all ${
                          done
                            ? "bg-primary text-primary-foreground"
                            : "bg-bg3 border border-border-bright text-muted-foreground hover:border-primary hover:text-primary"
                        }`}
                      >
                        {done ? "✓" : "•"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {lastSession && (
                <div className="text-[10px] text-muted-foreground/70 mt-2 text-center">
                  Sessão anterior: {new Date(lastSession.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  {" · "}
                  {lastSession.sets.filter(s => s.weight > 0).map(s => `${s.weight}×${s.reps}`).join(" / ") || "—"}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
