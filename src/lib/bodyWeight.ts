export interface BodyWeightEntry {
  date: string; // YYYY-MM-DD
  weight: number; // kg
  bmi: number;
}

const BODY_WEIGHT_KEY = "workout-body-weight";
const LAST_PROMPT_KEY = "workout-body-weight-last-prompt";
const CHECK_INTERVAL_DAYS = 14; // a cada 2 semanas
const HEIGHT_M = 1.68; // altura do Jefherson

export function loadBodyWeightHistory(): BodyWeightEntry[] {
  try {
    const saved = localStorage.getItem(BODY_WEIGHT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveBodyWeight(weight: number): BodyWeightEntry {
  const history = loadBodyWeightHistory();
  const today = new Date().toISOString().split("T")[0];
  const bmi = parseFloat((weight / (HEIGHT_M * HEIGHT_M)).toFixed(1));
  const entry: BodyWeightEntry = { date: today, weight, bmi };

  const existingIdx = history.findIndex(e => e.date === today);
  if (existingIdx >= 0) {
    history[existingIdx] = entry;
  } else {
    history.push(entry);
  }

  localStorage.setItem(BODY_WEIGHT_KEY, JSON.stringify(history));
  localStorage.setItem(LAST_PROMPT_KEY, today);
  return entry;
}

export function getLatestBodyWeight(): BodyWeightEntry | null {
  const history = loadBodyWeightHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

export function shouldPromptWeighIn(): boolean {
  const lastPrompt = localStorage.getItem(LAST_PROMPT_KEY);
  if (!lastPrompt) return true; // never prompted

  const last = new Date(lastPrompt + "T12:00:00");
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= CHECK_INTERVAL_DAYS;
}

export function dismissWeighInPrompt() {
  // Adiar por 1 dia (não marcar como feito, apenas ignorar por hoje)
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(LAST_PROMPT_KEY + "-dismissed", today);
}

export function wasDismissedToday(): boolean {
  const dismissed = localStorage.getItem(LAST_PROMPT_KEY + "-dismissed");
  if (!dismissed) return false;
  return dismissed === new Date().toISOString().split("T")[0];
}

export function getWeightChange(): { change: number; period: string } | null {
  const history = loadBodyWeightHistory();
  if (history.length < 2) return null;
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const change = parseFloat((latest.weight - previous.weight).toFixed(1));
  return { change, period: `desde ${formatDateShort(previous.date)}` };
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}
