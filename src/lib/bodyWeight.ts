import { supabase } from './supabase';
export interface BodyWeightEntry { date: string; weight: number; bmi: number; }
const DISMISSED_KEY = 'workout-body-weight-dismissed';
const CHECK_INTERVAL_DAYS = 14;

export async function loadBodyWeightHistory(studentId: string): Promise<BodyWeightEntry[]> {
  const { data } = await supabase.from('body_weight_logs').select('log_date, weight_kg, bmi').eq('student_id', studentId).order('log_date', { ascending: true });
  if (!data) return [];
  return data.map(r => ({ date: r.log_date, weight: Number(r.weight_kg), bmi: Number(r.bmi ?? 0) }));
}
export async function saveBodyWeight(weight: number, studentId: string, heightM: number | null): Promise<BodyWeightEntry> {
  const today = new Date().toISOString().split('T')[0]; const h = heightM ?? 1.7; const bmi = parseFloat((weight / (h * h)).toFixed(1));
  await supabase.from('body_weight_logs').upsert({ student_id: studentId, log_date: today, weight_kg: weight, bmi }, { onConflict: 'student_id,log_date' });
  return { date: today, weight, bmi };
}
export async function getLatestBodyWeight(studentId: string): Promise<BodyWeightEntry | null> {
  const { data } = await supabase.from('body_weight_logs').select('log_date, weight_kg, bmi').eq('student_id', studentId).order('log_date', { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  return { date: data.log_date, weight: Number(data.weight_kg), bmi: Number(data.bmi ?? 0) };
}
export async function getWeightChange(studentId: string): Promise<{ change: number; period: string } | null> {
  const { data } = await supabase.from('body_weight_logs').select('log_date, weight_kg').eq('student_id', studentId).order('log_date', { ascending: false }).limit(2);
  if (!data || data.length < 2) return null;
  const change = parseFloat((Number(data[0].weight_kg) - Number(data[1].weight_kg)).toFixed(1));
  return { change, period: `desde ${new Date(data[1].log_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}` };
}
export async function shouldPromptWeighIn(studentId: string): Promise<boolean> {
  if (wasDismissedToday()) return false;
  const { data } = await supabase.from('body_weight_logs').select('log_date').eq('student_id', studentId).order('log_date', { ascending: false }).limit(1).maybeSingle();
  if (!data) return true;
  const diffDays = Math.floor((Date.now() - new Date(data.log_date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= CHECK_INTERVAL_DAYS;
}
export function dismissWeighInPrompt() { sessionStorage.setItem(DISMISSED_KEY, new Date().toISOString().split('T')[0]); }
export function wasDismissedToday(): boolean { return sessionStorage.getItem(DISMISSED_KEY) === new Date().toISOString().split('T')[0]; }
