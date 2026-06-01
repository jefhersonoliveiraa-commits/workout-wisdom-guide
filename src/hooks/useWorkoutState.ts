import { useState, useCallback } from "react";

interface WorkoutState {
  setsCompleted: Record<string, boolean[]>;
  exercisesOpen: Record<string, boolean>;
}

const STORAGE_KEY = "workout-tracker-state";

function loadState(userId: string): WorkoutState {
  const key = `${STORAGE_KEY}:${userId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      const savedDate = localStorage.getItem(key + "-date");
      const today = new Date().toDateString();
      if (savedDate !== today) {
        localStorage.setItem(key + "-date", today);
        return { setsCompleted: {}, exercisesOpen: {} };
      }
      return parsed;
    }
  } catch {}
  localStorage.setItem(key + "-date", new Date().toDateString());
  return { setsCompleted: {}, exercisesOpen: {} };
}

export function useWorkoutState(userId: string) {
  const storageKey = `${STORAGE_KEY}:${userId}`;
  const [state, setState] = useState<WorkoutState>(() => loadState(userId));

  const toggleSet = useCallback((exId: string, setIndex: number, totalSets: number) => {
    setState(prev => {
      const sets = [...(prev.setsCompleted[exId] || Array(totalSets).fill(false))];
      sets[setIndex] = !sets[setIndex];
      const next = { ...prev, setsCompleted: { ...prev.setsCompleted, [exId]: sets } };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const toggleAllSets = useCallback((exId: string, totalSets: number) => {
    setState(prev => {
      const current = prev.setsCompleted[exId] || Array(totalSets).fill(false);
      const allDone = current.every(Boolean);
      const newSets = Array(totalSets).fill(!allDone);
      const next = { ...prev, setsCompleted: { ...prev.setsCompleted, [exId]: newSets } };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const toggleExOpen = useCallback((exId: string) => {
    setState(prev => {
      const next = {
        ...prev,
        exercisesOpen: { ...prev.exercisesOpen, [exId]: !prev.exercisesOpen[exId] },
      };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const isExerciseDone = useCallback((exId: string, totalSets: number) => {
    const sets = state.setsCompleted[exId];
    return sets ? sets.length >= totalSets && sets.every(Boolean) : false;
  }, [state.setsCompleted]);

  const getDayProgress = useCallback((dayIndex: number, exercises: { id: string; sets: number }[]) => {
    if (exercises.length === 0) return 0;
    let done = 0;
    exercises.forEach(ex => {
      if (isExerciseDone(ex.id, ex.sets)) done++;
    });
    return Math.round((done / exercises.length) * 100);
  }, [isExerciseDone]);

  return {
    state,
    toggleSet,
    toggleAllSets,
    toggleExOpen,
    isExerciseDone,
    getDayProgress,
  };
}
