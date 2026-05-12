// ───── Per-set logging ─────
// Cada exercício, em cada data, tem um array de sets (peso + reps por série).

export interface SetLog {
  weight: number; // kg
  reps: number;
}

export interface ExerciseSession {
  exerciseId: string;
  date: string; // YYYY-MM-DD
  sets: SetLog[];
}

// Compatibilidade com o gráfico antigo
export interface WeightEntry {
  exerciseId: string;
  weight: number; // top set / maior peso da sessão
  unit: "kg";
  reps: string;
  date: string;
}

export interface TrainingSession {
  date: string;
  dayIndex: number;
  dayTitle: string;
  exercisesCompleted: number;
  totalExercises: number;
  weights: Record<string, number>;
}

const SETS_KEY = "workout-sets-v2";
const HISTORY_KEY = "workout-history";

// ───── Set logs ─────
type AllSets = Record<string, ExerciseSession[]>; // exerciseId -> sessions

function loadAll(): AllSets {
  try {
    const raw = localStorage.getItem(SETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(all: AllSets) {
  localStorage.setItem(SETS_KEY, JSON.stringify(all));
}

/** Salva (cria/atualiza) o log de uma série específica do dia atual. */
export function saveSet(exerciseId: string, setIndex: number, set: SetLog) {
  const all = loadAll();
  const date = new Date().toISOString().split("T")[0];
  if (!all[exerciseId]) all[exerciseId] = [];
  let session = all[exerciseId].find(s => s.date === date);
  if (!session) {
    session = { exerciseId, date, sets: [] };
    all[exerciseId].push(session);
  }
  // Garantir tamanho do array de sets
  while (session.sets.length <= setIndex) session.sets.push({ weight: 0, reps: 0 });
  session.sets[setIndex] = set;
  // Limita histórico a 90 sessões por exercício
  if (all[exerciseId].length > 90) {
    all[exerciseId] = all[exerciseId].slice(-90);
  }
  persist(all);
}

/** Retorna a sessão de hoje (ou null) para preencher inputs. */
export function getTodaySession(exerciseId: string): ExerciseSession | null {
  const all = loadAll();
  const date = new Date().toISOString().split("T")[0];
  return all[exerciseId]?.find(s => s.date === date) || null;
}

/** Retorna a última sessão registrada (anterior a hoje, ou hoje se não houver outra) para sugestão de carga. */
export function getLastSession(exerciseId: string): ExerciseSession | null {
  const all = loadAll();
  const sessions = all[exerciseId];
  if (!sessions || sessions.length === 0) return null;
  return [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
}

/** Top set (maior peso × reps) por sessão — usado no gráfico de evolução. */
export function getTopSetHistory(exerciseId: string): { date: string; weight: number; reps: number }[] {
  const all = loadAll();
  const sessions = all[exerciseId] || [];
  return sessions
    .map(s => {
      const valid = s.sets.filter(set => set.weight > 0);
      if (valid.length === 0) return null;
      const top = valid.reduce((a, b) => (b.weight > a.weight ? b : a));
      return { date: s.date, weight: top.weight, reps: top.reps };
    })
    .filter((x): x is { date: string; weight: number; reps: number } => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Volume total (sum weight×reps) por sessão. */
export function getVolumeHistory(exerciseId: string): { date: string; volume: number }[] {
  const all = loadAll();
  const sessions = all[exerciseId] || [];
  return sessions
    .map(s => ({
      date: s.date,
      volume: s.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    }))
    .filter(s => s.volume > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Histórico completo de sessões de um exercício (todas as séries). */
export function getExerciseSessions(exerciseId: string): ExerciseSession[] {
  const all = loadAll();
  return [...(all[exerciseId] || [])].sort((a, b) => b.date.localeCompare(a.date));
}

// ───── Compatibilidade ─────
export function getLatestWeight(exerciseId: string): WeightEntry | null {
  const last = getLastSession(exerciseId);
  if (!last) return null;
  const valid = last.sets.filter(s => s.weight > 0);
  if (valid.length === 0) return null;
  const top = valid.reduce((a, b) => (b.weight > a.weight ? b : a));
  return {
    exerciseId,
    weight: top.weight,
    unit: "kg",
    reps: String(top.reps),
    date: last.date,
  };
}

// ───── Sessões de treino (resumo diário) ─────
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
  if (existing >= 0) history[existing] = session;
  else history.push(session);
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
