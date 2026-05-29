
-- workout_logs
CREATE TABLE public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  exercise_id text NOT NULL,
  plan_id uuid,
  log_date date NOT NULL,
  sets_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  observation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, exercise_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT ALL ON public.workout_logs TO service_role;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own logs" ON public.workout_logs FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Trainers view student logs" ON public.workout_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.student_id = workout_logs.student_id AND wp.trainer_id = auth.uid()));

CREATE INDEX idx_workout_logs_student_date ON public.workout_logs(student_id, log_date DESC);
CREATE INDEX idx_workout_logs_student_exercise ON public.workout_logs(student_id, exercise_id, log_date DESC);

-- body_weight_logs
CREATE TABLE public.body_weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  log_date date NOT NULL,
  weight_kg numeric NOT NULL,
  bmi numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_weight_logs TO authenticated;
GRANT ALL ON public.body_weight_logs TO service_role;
ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own body weight" ON public.body_weight_logs FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Trainers view student body weight" ON public.body_weight_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.student_id = body_weight_logs.student_id AND wp.trainer_id = auth.uid()));

CREATE INDEX idx_body_weight_student_date ON public.body_weight_logs(student_id, log_date DESC);

-- training_sessions
CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  plan_id uuid,
  session_date date NOT NULL,
  day_index integer NOT NULL,
  day_title text NOT NULL DEFAULT '',
  exercises_completed integer NOT NULL DEFAULT 0,
  total_exercises integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, session_date, day_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_sessions TO authenticated;
GRANT ALL ON public.training_sessions TO service_role;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own sessions" ON public.training_sessions FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Trainers view student sessions" ON public.training_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.student_id = training_sessions.student_id AND wp.trainer_id = auth.uid()));

CREATE INDEX idx_training_sessions_student_date ON public.training_sessions(student_id, session_date DESC);
