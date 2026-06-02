
-- 1) Attach trigger to enforce role immutability on profiles
DROP TRIGGER IF EXISTS enforce_role_immutable ON public.profiles;
CREATE TRIGGER enforce_role_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- 2) Harden handle_new_user: always default to 'student', ignore user-supplied role metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, height_m)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'student'::public.app_role,
    NULLIF(NEW.raw_user_meta_data->>'height_m', '')::numeric
  );
  RETURN NEW;
END;
$function$;

-- 3) Add role guard to trainer_student policy (only trainers can create links)
DROP POLICY IF EXISTS "Trainer manages their students" ON public.trainer_student;
CREATE POLICY "Trainer manages their students"
  ON public.trainer_student
  FOR ALL
  TO authenticated
  USING (trainer_id = auth.uid() AND public.current_role_is('trainer'))
  WITH CHECK (trainer_id = auth.uid() AND public.current_role_is('trainer'));

-- 4) Restrict search_students_for_linking to trainers only
CREATE OR REPLACE FUNCTION public.search_students_for_linking(search_name text)
RETURNS TABLE(id uuid, full_name text, already_has_trainer boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name,
    EXISTS (SELECT 1 FROM public.trainer_student ts WHERE ts.student_id = p.id) AS already_has_trainer
  FROM public.profiles p
  WHERE p.role = 'student'
    AND p.full_name ILIKE '%' || search_name || '%'
    AND p.id <> auth.uid()
    AND public.current_role_is('trainer')
  ORDER BY p.full_name
  LIMIT 20;
$function$;
