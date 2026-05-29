import { supabase } from './supabase';

export interface SetLog {
  weight: number;
  reps: number;
}

export interface ExerciseSession {
  exerciseId: string;
  date: string;
  sets: SetLog[];
  observation?: string;
}

export interface WeightEntry {
  exerciseId: string;
  weight: number;
  unit: 'kg';
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

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ───── Set logs ─────

export async function saveSet(
  exerciseId: string,
  setIndex: number,
  set: SetLog,
  studentId: string,
  planId?: string
) {
  const date = today();

  const { data: existing } = await supabase
    .from('workout_logs')
    .select('id, sets_data')
    .eq('student_id', studentId)
    .eq('exercise_id', exerciseId)
    .eq('log_date', date)
    .single();

  const setsData: SetLog[] = existing?.sets_data ? [...existing.sets_data] : [];
  while (setsData.length <= setIndex) setsData.push({ weight: 0, reps: 0 });
  setsData[setIndex] = set;

  await supabase.from('workout_logs').upsert({
    ...(existing ? { id: existing.id } : {}),
    student_id: studentId,
    exercise_id: exerciseId,
    plan_id: planId ?? null,
    log_date: date,
    sets_data: setsData,
  });
}

export async function saveObservation(
  exerciseId: string,
  observation: string,
  studentId: string
) {
  const date = today();

  const { data: existing } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('student_id', studentId)
    .eq('exercise_id', exerciseId)
    .eq('log_date', date)
    .single();

  if (existing) {
    await supabase.from('workout_logs').update({ observation }).eq('id', existing.id);
  } else {
    await supabase.from('workout_logs').insert({
      student_id: studentId,
      exercise_id: exerciseId,
      log_date: date,
      sets_data: [],
      observation,
    });
  }
}

export async function getTodaySession(exerciseId: string, studentId: string): Promise<ExerciseSession | null> {
  const { data } = await supabase
    .from('workout_logs')
    .select('sets_data, observation')
    .eq('student_id', studentId)
    .eq('exercise_id', exerciseId)
    .eq('log_date', today())
    .single();

  if (!data) return null;
  return { exerciseId, date: today(), sets: data.sets_data ?? [], observation: data.observation ?? '' };
}

export async function getLastSession(exerciseId: string, studentId: string): Promise<ExerciseSession | null> {
  const { data } = await supabase
    .from('workout_logs')
    .select('sets_data, log_date, observation')
    .eq('student_id', studentId)
    .eq('exercise_id', exerciseId)
    .order('log_date', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;
  return { exerciseId, date: data.log_date, sets: data.sets_data ?? [], observation: data.observation ?? '' };
}

export async function getTopSetHistory(
  exerciseId: string,
  studentId: string
): Promise<{ date: string; weight: number; reps: number }[]> {
  const { data } = await supabase
    .from('workout_logs')
    .select('sets_data, log_date')
    .eq('student_id', studentId)
    .eq('exercise_id', exerciseId)
    .order('log_date', { ascending: true });

  if (!data) return [];

  return data
    .map(row => {
      const valid = (row.sets_data as SetLog[]).filter(s => s.weight > 0);
      if (valid.length === 0) return null;
      const top = valid.reduce((a, b) => (b.weight > a.weight ? b : a));
      return { date: row.log_date, weight: top.weight, reps: top.reps };
    })
    .filter((x): x is { date: string; weight: number; reps: number } => x !== null);
}

export async function getVolumeHistory(
  exerciseId: string,
  studentId: string
): Promise<{ date: string; volume: number }[]> {
  const { data } = await supabase
    .from('workout_logs')
    .select('sets_data, log_date')
    .eq('student_id', studentId)
    .eq('exercise_id', exerciseId)
    .order('log_date', { ascending: true });

  if (!data) return [];

  return data
    .map(row => ({
      date: row.log_date,
      volume: (row.sets_data as SetLog[]).reduce((sum, s) => sum + s.weight * s.reps, 0),
    }))
    .filter(s => s.volume > 0);
}

export async function getExerciseSessions(exerciseId: string, studentId: string): Promise<ExerciseSession[]> {
  const { data } = await supabase
    .from('workout_logs')
    .select('sets_data, log_date, observation')
    .eq('student_id', studentId)
    .eq('exercise_id', exerciseId)
    .order('log_date', { ascending: false });

  if (!data) return [];
  return data.map(row => ({
    exerciseId,
    date: row.log_date,
    sets: row.sets_data ?? [],
    observation: row.observation ?? '',
  }));
}

export async function getLatestWeight(exerciseId: string, studentId: string): Promise<WeightEntry | null> {
  const last = await getLastSession(exerciseId, studentId);
  if (!last) return null;
  const valid = last.sets.filter(s => s.weight > 0);
  if (valid.length === 0) return null;
  const top = valid.reduce((a, b) => (b.weight > a.weight ? b : a));
  return { exerciseId, weight: top.weight, unit: 'kg', reps: String(top.reps), date: last.date };
}

// ───── Training sessions (daily summary) ─────

export async function loadHistory(studentId: string): Promise<TrainingSession[]> {
  const { data } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });

  if (!data) return [];
  return data.map(r => ({
    date: r.session_date,
    dayIndex: r.day_index,
    dayTitle: r.day_title,
    exercisesCompleted: r.exercises_completed,
    totalExercises: r.total_exercises,
    weights: {},
  }));
}

export async function saveSession(session: TrainingSession, studentId: string, planId?: string) {
  await supabase.from('training_sessions').upsert({
    student_id: studentId,
    plan_id: planId ?? null,
    session_date: session.date,
    day_index: session.dayIndex,
    day_title: session.dayTitle,
    exercises_completed: session.exercisesCompleted,
    total_exercises: session.totalExercises,
  }, { onConflict: 'student_id,session_date,day_index' });
}

export async function getWeekHistory(studentId: string): Promise<TrainingSession[]> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('student_id', studentId)
    .gte('session_date', startOfWeek.toISOString().split('T')[0])
    .order('session_date', { ascending: false });

  if (!data) return [];
  return data.map(r => ({
    date: r.session_date,
    dayIndex: r.day_index,
    dayTitle: r.day_title,
    exercisesCompleted: r.exercises_completed,
    totalExercises: r.total_exercises,
    weights: {},
  }));
}
