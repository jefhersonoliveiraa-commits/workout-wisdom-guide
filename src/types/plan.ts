export interface DbExercise {
  id: string; day_id: string; name: string; muscle: string | null; sets: number; reps: string;
  rest: string; rir: string | null; technique: string | null; warnings: string[] | null;
  description: string | null; sort_order: number; suggested_load: number | null; external_exercise_id: string | null;
}
export interface DbTrainingDay {
  id: string; plan_id: string; day_index: number; day_label: string; short_label: string;
  title: string; color_class: string; tags: string[] | null; estimated_time: string | null;
  is_rest: boolean; warning_title: string | null; warning_text: string | null; sort_order: number; exercises: DbExercise[];
}
export interface DbWorkoutPlan {
  id: string; trainer_id: string; student_id: string; name: string; description: string | null;
  is_active: boolean; training_days: DbTrainingDay[];
}
