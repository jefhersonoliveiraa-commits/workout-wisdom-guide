-- trainer_student: vinculo treinador<->aluno (faltava nas migrations do Lovable)
CREATE TABLE IF NOT EXISTS public.trainer_student (
  trainer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trainer_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_student TO authenticated;
GRANT ALL ON public.trainer_student TO service_role;

ALTER TABLE public.trainer_student ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainer manages their students" ON public.trainer_student;
CREATE POLICY "Trainer manages their students"
  ON public.trainer_student FOR ALL TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS "Student sees their trainer link" ON public.trainer_student;
CREATE POLICY "Student sees their trainer link"
  ON public.trainer_student FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- treinador ve perfis dos alunos vinculados
DROP POLICY IF EXISTS "Trainers view linked students" ON public.profiles;
CREATE POLICY "Trainers view linked students"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts
                 WHERE ts.trainer_id = auth.uid() AND ts.student_id = profiles.id));

-- treinador le logs/sessoes/peso dos alunos vinculados
DROP POLICY IF EXISTS "Trainer reads student logs" ON public.workout_logs;
CREATE POLICY "Trainer reads student logs"
  ON public.workout_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts
                 WHERE ts.trainer_id = auth.uid() AND ts.student_id = workout_logs.student_id));

DROP POLICY IF EXISTS "Trainer reads student sessions" ON public.training_sessions;
CREATE POLICY "Trainer reads student sessions"
  ON public.training_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts
                 WHERE ts.trainer_id = auth.uid() AND ts.student_id = training_sessions.student_id));

DROP POLICY IF EXISTS "Trainer reads student weight" ON public.body_weight_logs;
CREATE POLICY "Trainer reads student weight"
  ON public.body_weight_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts
                 WHERE ts.trainer_id = auth.uid() AND ts.student_id = body_weight_logs.student_id));
