import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DbWorkoutPlan } from '@/types/plan';

async function fetchStudentPlan(studentId: string): Promise<DbWorkoutPlan | null> {
  const { data: plan, error } = await supabase.from('workout_plans').select('*').eq('student_id', studentId).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error || !plan) return null;
  const { data: days } = await supabase.from('training_days').select('*').eq('plan_id', plan.id).order('sort_order', { ascending: true });
  if (!days) return { ...plan, training_days: [] } as unknown as DbWorkoutPlan;
  const { data: exercises } = await supabase.from('exercises').select('*').in('day_id', days.map((d: { id: string }) => d.id)).order('sort_order', { ascending: true });
  return { ...plan, training_days: days.map((d: { id: string }) => ({ ...d, exercises: (exercises ?? []).filter((e: { day_id: string }) => e.day_id === d.id) })) } as unknown as DbWorkoutPlan;
}
export function useStudentPlan(studentId: string | undefined) {
  return useQuery({ queryKey: ['student-plan', studentId], queryFn: () => fetchStudentPlan(studentId!), enabled: !!studentId, staleTime: 5 * 60 * 1000 });
}
