-- Revoke default PUBLIC EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.current_role_is(public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_plan_trainer(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_plan_student(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.day_plan_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_students_for_linking(text) FROM PUBLIC, anon;

-- RLS helpers still need to be callable by authenticated (used inside policies)
GRANT EXECUTE ON FUNCTION public.current_role_is(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_plan_trainer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_plan_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.day_plan_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_students_for_linking(text) TO authenticated;

-- Drop workout_plans from realtime publication to stop unrestricted change broadcasts
ALTER PUBLICATION supabase_realtime DROP TABLE public.workout_plans;