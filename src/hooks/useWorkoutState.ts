import { useState, useCallback } from "react";

interface WorkoutState {
  setsCompleted: Record<string, boolean[]>;
  exercisesOpen: Record<string, boolean>;
}

const STORAGE_KEY = "workout-tracker-state";

function loadState(): WorkoutState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset if it's a new day
      const savedDate = localStorage.getItem(STORAGE_KEY + "-date");
      const today = new Date().toDateString();
      if (savedDate !== today) {
        localStorage.setItem(STORAGE_KEY + "-date", today);
        return { setsCompleted: {}, exercisesOpen: {} };
      }
      return parsed;
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY + "-date", new Date().toDateString());
  return { setsCompleted: {}, exercisesOpen: {} };
}

export function useWorkoutState() {
  const [state, setState] = useState<WorkoutState>(loadState);

  const save = useCallback((newState: WorkoutState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const toggleSet = useCallback((exId: string, setIndex: number, totalSets: number) => {
    setState(prev => {
      const sets = [...(prev.setsCompleted[exId] || Array(totalSets).fill(false))];
      sets[setIndex] = !sets[setIndex];
      const next = { ...prev, setsCompleted: { ...prev.setsCompleted, [exId]: sets } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleAllSets = useCallback((exId: string, totalSets: number) => {
    setState(prev => {
      const current = prev.setsCompleted[exId] || Array(totalSets).fill(false);
      const allDone = current.every(Boolean);
      const newSets = Array(totalSets).fill(!allDone);
      const next = { ...prev, setsCompleted: { ...prev.setsCompleted, [exId]: newSets } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleExOpen = useCallback((exId: string) => {
    setState(prev => {
      const next = {
        ...prev,
        exercisesOpen: { ...prev.exercisesOpen, [exId]: !prev.exercisesOpen[exId] },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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
