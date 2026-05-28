-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('trainer', 'student');

-- ───────── TABELAS ─────────
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'student',
  height_m numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.training_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  day_index integer NOT NULL DEFAULT 0,
  day_label text NOT NULL DEFAULT '',
  short_label text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  color_class text NOT NULL DEFAULT 'primary',
  tags text[],
  estimated_time text,
  is_rest boolean NOT NULL DEFAULT false,
  warning_title text,
  warning_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.training_days(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  muscle text,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '',
  rest text NOT NULL DEFAULT '',
  rir text,
  technique text,
  warnings text[],
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  suggested_load numeric,
  external_exercise_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ───────── GRANTS ─────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;
GRANT ALL ON public.workout_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_days TO authenticated;
GRANT ALL ON public.training_days TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;

-- ───────── FUNÇÕES AUXILIARES (security definer) ─────────
CREATE OR REPLACE FUNCTION public.current_role_is(_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_plan_trainer(_plan_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workout_plans WHERE id = _plan_id AND trainer_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_plan_student(_plan_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workout_plans WHERE id = _plan_id AND student_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.day_plan_id(_day_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT plan_id FROM public.training_days WHERE id = _day_id;
$$;

-- ───────── RLS ─────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Trainers can view their students profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.current_role_is('trainer')
    AND EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.student_id = profiles.id AND wp.trainer_id = auth.uid())
  );
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Trainers manage own plans"
  ON public.workout_plans FOR ALL TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "Students view their plans"
  ON public.workout_plans FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Trainers manage days of own plans"
  ON public.training_days FOR ALL TO authenticated
  USING (public.is_plan_trainer(plan_id)) WITH CHECK (public.is_plan_trainer(plan_id));
CREATE POLICY "Students view days of their plans"
  ON public.training_days FOR SELECT TO authenticated
  USING (public.is_plan_student(plan_id));

CREATE POLICY "Trainers manage exercises of own plans"
  ON public.exercises FOR ALL TO authenticated
  USING (public.is_plan_trainer(public.day_plan_id(day_id)))
  WITH CHECK (public.is_plan_trainer(public.day_plan_id(day_id)));
CREATE POLICY "Students view exercises of their plans"
  ON public.exercises FOR SELECT TO authenticated
  USING (public.is_plan_student(public.day_plan_id(day_id)));

-- ───────── Trigger de criação de perfil ─────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, height_m)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student'),
    NULLIF(NEW.raw_user_meta_data->>'height_m', '')::numeric
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();