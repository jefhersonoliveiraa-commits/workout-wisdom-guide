import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getTodaySession, getLastSession, saveSet, saveObservation, type SetLog } from "@/lib/storage";

export interface WorkoutExercise {
  id: string;
  name: string;
  muscle?: string | null;
  sets: number;
  reps: string;
  rest: string;
  rir?: string | null;
  technique?: string | null;
  warnings?: string[] | null;
  description?: string | null;
  suggested_load?: number | null;
}

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  studentId: string;
  planId?: string;
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
  studentId,
  planId,
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

  const { data: todaySession } = useQuery({
    queryKey: ['today-session', exercise.id, studentId],
    queryFn: () => getTodaySession(exercise.id, studentId),
    staleTime: 30_000,
  });

  const { data: lastSession } = useQuery({
    queryKey: ['last-session', exercise.id, studentId],
    queryFn: () => getLastSession(exercise.id, studentId),
    staleTime: 5 * 60_000,
  });

  const [inputs, setInputs] = useState<SetInput[]>(() =>
    Array.from({ length: exercise.sets }, () => ({ weight: "", reps: "" }))
  );
  const [observation, setObservation] = useState("");

  // Populate inputs when session data loads
  useEffect(() => {
    const source = todaySession ?? lastSession;
    if (!source) return;
    setInputs(
      Array.from({ length: exercise.sets }, (_, i) => {
        const s = source.sets[i];
        return {
          weight: s && s.weight > 0 ? String(s.weight) : "",
          reps: s && s.reps > 0 ? String(s.reps) : "",
        };
      })
    );
    if (todaySession?.observation) setObservation(todaySession.observation);
  }, [todaySession, lastSession, exercise.sets]);

  useEffect(() => {
    setInputs(prev => {
      if (prev.length === exercise.sets) return prev;
      const next = [...prev];
      while (next.length < exercise.sets) next.push({ weight: "", reps: "" });
      return next.slice(0, exercise.sets);
    });
  }, [exercise.sets]);

  const todayTopWeight = (() => {
    const valid = todaySession?.sets.filter(s => s.weight > 0) || [];
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

  const persistSet = useCallback(async (idx: number): Promise<SetLog | null> => {
    const w = parseFloat(inputs[idx].weight.replace(",", "."));
    const r = parseInt(inputs[idx].reps);
    if (!isNaN(w) && w > 0 && !isNaN(r) && r > 0) {
      const log = { weight: w, reps: r };
      await saveSet(exercise.id, idx, log, studentId, planId);
      return log;
    }
    return null;
  }, [inputs, exercise.id, studentId, planId]);

  const handleSetClick = async (idx: number, done: boolean) => {
    if (!done) {
      await persistSet(idx);
      onSetComplete(restSeconds);
    }
    onToggleSet(idx);
  };

  const handleObservationBlur = async () => {
    if (observation.trim()) {
      await saveObservation(exercise.id, observation, studentId);
    }
  };

  const suggestedPlaceholder = (idx: number) => {
    const lastW = lastSession?.sets[idx]?.weight;
    if (lastW && lastW > 0) return String(lastW);
    if (exercise.suggested_load) return String(exercise.suggested_load);
    return "0";
  };

  const warnings = exercise.warnings ?? [];

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
        ) : exercise.suggested_load ? (
          <span className="text-[10px] font-mono text-muted-foreground/50 flex-shrink-0">
            sug. {exercise.suggested_load}kg
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
        {warnings.map((w, i) => (
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
              {exercise.description && (
                <p className="text-[13px] text-muted-foreground leading-[1.7]">{exercise.description}</p>
              )}

              {exercise.technique && (
                <div className="mt-3 bg-primary/[0.08] border border-primary/30 rounded-sm p-3">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                    🔥 Técnica avançada
                  </div>
                  <div className="text-[12px] text-primary/90 leading-[1.6]">{exercise.technique}</div>
                </div>
              )}

              <div className="grid grid-cols-[44px_1fr_1fr_44px] gap-2 mt-4 px-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sér.</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Carga (kg)</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Reps</div>
                <div></div>
              </div>

              <div className="space-y-2 mt-2">
                {sets.map((done, idx) => {
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
                        placeholder={suggestedPlaceholder(idx)}
                        className="w-full bg-bg3 border border-border rounded-[6px] px-2 py-1 text-[14px] font-mono text-foreground text-center outline-none focus:border-primary transition-colors"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        value={inputs[idx]?.reps || ""}
                        onChange={(e) => updateInput(idx, "reps", e.target.value)}
                        onBlur={() => persistSet(idx)}
                        placeholder={lastSession?.sets[idx]?.reps ? String(lastSession.sets[idx].reps) : "0"}
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

              <div className="mt-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Observação</div>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  onBlur={handleObservationBlur}
                  placeholder="Como foi? Dor, fadiga, sensação..."
                  rows={2}
                  className="w-full bg-bg3 border border-border rounded-[6px] px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-colors resize-none"
                />
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
