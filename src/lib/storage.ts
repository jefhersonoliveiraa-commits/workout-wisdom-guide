export interface WeightEntry {
  exerciseId: string;
  weight: number;
  unit: "kg" | "lb";
  reps: string;
  date: string; // ISO date string YYYY-MM-DD
}

export interface TrainingSession {
  date: string;
  dayIndex: number;
  dayTitle: string;
  exercisesCompleted: number;
  totalExercises: number;
  weights: Record<string, number>; // exerciseId -> weight
}

const WEIGHTS_KEY = "workout-weights";
const HISTORY_KEY = "workout-history";

export function loadWeights(): Record<string, WeightEntry[]> {
  try {
    const saved = localStorage.getItem(WEIGHTS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveWeight(entry: WeightEntry) {
  const all = loadWeights();
  if (!all[entry.exerciseId]) all[entry.exerciseId] = [];
  // Avoid duplicate for same date
  const existing = all[entry.exerciseId].findIndex(e => e.date === entry.date);
  if (existing >= 0) {
    all[entry.exerciseId][existing] = entry;
  } else {
    all[entry.exerciseId].push(entry);
  }
  // Keep last 60 entries per exercise
  if (all[entry.exerciseId].length > 60) {
    all[entry.exerciseId] = all[entry.exerciseId].slice(-60);
  }
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(all));
  return all;
}

export function getLatestWeight(exerciseId: string): WeightEntry | null {
  const all = loadWeights();
  const entries = all[exerciseId];
  if (!entries || entries.length === 0) return null;
  return entries[entries.length - 1];
}

export function getWeightHistory(exerciseId: string): WeightEntry[] {
  const all = loadWeights();
  return all[exerciseId] || [];
}

export function loadHistory(): TrainingSession[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: TrainingSession) {
  const history = loadHistory();
  const existing = history.findIndex(
    s => s.date === session.date && s.dayIndex === session.dayIndex
  );
  if (existing >= 0) {
    history[existing] = session;
  } else {
    history.push(session);
  }
  // Keep last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const filtered = history.filter(s => new Date(s.date) >= cutoff);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  return filtered;
}

export function getWeekHistory(): TrainingSession[] {
  const history = loadHistory();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return history.filter(s => new Date(s.date) >= startOfWeek);
}
