-- BLOCO 1: Bloquear escalada de role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'Alteração de role não é permitida.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON public.profiles FOR EACH ROW
  WHEN (NEW.role IS DISTINCT FROM OLD.role)
  EXECUTE FUNCTION public.prevent_role_change();
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));

-- BLOCO 2: Remover visibilidade ampla de perfis
DROP POLICY IF EXISTS "Personais podem ver alunos" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios veem o proprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can view their students profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers view linked students" ON public.profiles;
CREATE POLICY "Trainers view linked students"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts WHERE ts.trainer_id = auth.uid() AND ts.student_id = profiles.id));

-- BLOCO 3: Corrigir INSERT de workout_plans
DROP POLICY IF EXISTS "Trainers manage own plans" ON public.workout_plans;
CREATE POLICY "Trainers manage own plans"
  ON public.workout_plans FOR ALL TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (
    trainer_id = auth.uid()
    AND (is_template = true OR (student_id IS NOT NULL AND student_id IN (
      SELECT ts.student_id FROM public.trainer_student ts WHERE ts.trainer_id = auth.uid()
    )))
  );

-- BLOCO 4: Migrar políticas para trainer_student
DROP POLICY IF EXISTS "Trainers view student body weight" ON public.body_weight_logs;
DROP POLICY IF EXISTS "Trainer reads student weight" ON public.body_weight_logs;
CREATE POLICY "Trainer reads student weight" ON public.body_weight_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts WHERE ts.trainer_id = auth.uid() AND ts.student_id = body_weight_logs.student_id));

DROP POLICY IF EXISTS "Trainers view student logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Trainer reads student logs" ON public.workout_logs;
CREATE POLICY "Trainer reads student logs" ON public.workout_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts WHERE ts.trainer_id = auth.uid() AND ts.student_id = workout_logs.student_id));

DROP POLICY IF EXISTS "Trainers view student sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Trainer reads student sessions" ON public.training_sessions;
CREATE POLICY "Trainer reads student sessions" ON public.training_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_student ts WHERE ts.trainer_id = auth.uid() AND ts.student_id = training_sessions.student_id));

-- BLOCO 5: Limpar duplicatas
DROP POLICY IF EXISTS "Aluno ve proprios planos" ON public.workout_plans;
DROP POLICY IF EXISTS "Aluno ve proprios dias" ON public.training_days;
DROP POLICY IF EXISTS "Aluno ve proprios exercicios" ON public.exercises;

-- BLOCO 6: RPC segura de busca por nome
CREATE OR REPLACE FUNCTION public.search_students_for_linking(search_name text)
RETURNS TABLE (id uuid, full_name text, already_has_trainer boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name,
    EXISTS (SELECT 1 FROM public.trainer_student ts WHERE ts.student_id = p.id) AS already_has_trainer
  FROM public.profiles p
  WHERE p.role = 'student' AND p.full_name ILIKE '%' || search_name || '%' AND p.id <> auth.uid()
  ORDER BY p.full_name LIMIT 20;
$$;
REVOKE EXECUTE ON FUNCTION public.search_students_for_linking(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.search_students_for_linking(text) TO authenticated;

-- BLOCO 7: Revogar acesso anônimo
REVOKE EXECUTE ON FUNCTION public.current_role_is(public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_plan_trainer(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_plan_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.day_plan_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_change() FROM anon, authenticated;
