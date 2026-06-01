#!/usr/bin/env bash
# apply-security-fixes.sh
# Rode na RAIZ do repositório no seu Codespace.
set -euo pipefail

if [ ! -f package.json ] || [ ! -d src ]; then
  echo "❌ Rode na raiz do repositório (onde está package.json)."
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Há mudanças não commitadas. Faça commit ou 'git stash' antes."
  exit 1
fi

echo "▶ Atualizando main..."
git fetch origin main
git checkout main
git pull origin main

echo "▶ Gravando TrainerDashboard.tsx..."
cat > src/pages/trainer/TrainerDashboard.tsx <<'TSX_EOF'
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserPlus, ChevronRight, ClipboardList, Edit2, UserCheck, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TrainerNav } from "@/components/trainer/TrainerNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StudentInfo {
  id: string;
  full_name: string;
  planName: string | null;
  lastSession: string | null;
}

interface TemplatePlan {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface StudentSearchResult {
  id: string;
  full_name: string;
  already_has_trainer: boolean;
}

async function fetchStudents(trainerId: string): Promise<StudentInfo[]> {
  const { data: links } = await supabase
    .from('trainer_student')
    .select('student_id')
    .eq('trainer_id', trainerId);

  if (!links || links.length === 0) return [];

  const studentIds = links.map(l => l.student_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', studentIds);

  const { data: plans } = await supabase
    .from('workout_plans')
    .select('student_id, name')
    .in('student_id', studentIds)
    .eq('is_active', true);

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('student_id, session_date')
    .in('student_id', studentIds)
    .order('session_date', { ascending: false });

  return (profiles ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    planName: plans?.find(pl => pl.student_id === p.id)?.name ?? null,
    lastSession: sessions?.find(s => s.student_id === p.id)?.session_date ?? null,
  }));
}

async function fetchTemplates(trainerId: string): Promise<TemplatePlan[]> {
  const { data } = await supabase
    .from('workout_plans')
    .select('id, name, description, created_at')
    .eq('trainer_id', trainerId)
    .eq('is_template', true)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [linkSearch, setLinkSearch] = useState("");
  const [linkResults, setLinkResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [assigningTemplate, setAssigningTemplate] = useState<TemplatePlan | null>(null);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const { data: students = [], refetch: refetchStudents } = useQuery({
    queryKey: ['trainer-students', user?.id],
    queryFn: () => fetchStudents(user!.id),
    enabled: !!user?.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['trainer-templates', user?.id],
    queryFn: () => fetchTemplates(user!.id),
    enabled: !!user?.id,
  });

  const handleLinkSearchChange = (value: string) => {
    setLinkSearch(value);
    clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setLinkResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase.rpc('search_students_for_linking', {
        search_name: value.trim(),
      });
      setLinkResults((data as StudentSearchResult[]) ?? []);
      setIsSearching(false);
    }, 400);
  };

  const handleLinkStudent = async (studentId: string, alreadyHasTrainer: boolean) => {
    if (alreadyHasTrainer) {
      toast.error('Este aluno já possui um treinador. Peça para ele se desvincular primeiro.');
      return;
    }
    if (!user?.id) return;
    setLinking(true);
    const { error } = await supabase.from('trainer_student').insert({
      trainer_id: user.id,
      student_id: studentId,
    });
    setLinking(false);
    if (error) {
      toast.error('Erro ao vincular: ' + error.message);
    } else {
      toast.success('Aluno vinculado!');
      setLinkSearch('');
      setLinkResults([]);
      refetchStudents();
    }
  };

  const handleAssignTemplate = async () => {
    if (!assigningTemplate || !assignStudentId || !user?.id) return;
    setAssigning(true);

    const { data: newPlan, error: planErr } = await supabase
      .from('workout_plans')
      .insert({
        trainer_id: user.id,
        student_id: assignStudentId,
        name: assigningTemplate.name,
        description: assigningTemplate.description,
        is_active: false,
        is_template: false,
      })
      .select()
      .single();

    if (planErr || !newPlan) {
      toast.error('Erro ao atribuir ficha');
      setAssigning(false);
      return;
    }

    const { data: days } = await supabase
      .from('training_days')
      .select('*')
      .eq('plan_id', assigningTemplate.id)
      .order('sort_order');

    for (const day of days ?? []) {
      const { data: newDay } = await supabase
        .from('training_days')
        .insert({
          plan_id: newPlan.id,
          day_index: day.day_index,
          short_label: day.short_label,
          title: day.title,
          color_class: day.color_class,
          tags: day.tags,
          is_rest: day.is_rest,
          estimated_time: day.estimated_time,
          warning_title: day.warning_title,
          warning_text: day.warning_text,
          sort_order: day.sort_order,
        })
        .select()
        .single();

      if (!newDay) continue;

      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('day_id', day.id)
        .order('sort_order');

      if (exercises && exercises.length > 0) {
        await supabase.from('exercises').insert(
          exercises.map(ex => ({
            day_id: newDay.id,
            name: ex.name,
            muscle: ex.muscle,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest,
            rir: ex.rir,
            technique: ex.technique,
            warnings: ex.warnings,
            suggested_load: ex.suggested_load,
            description: ex.description,
            sort_order: ex.sort_order,
          }))
        );
      }
    }

    const { error: activateErr } = await supabase
      .from('workout_plans')
      .update({ is_active: true })
      .eq('id', newPlan.id);
    if (activateErr) {
      toast.error('Erro ao ativar a ficha');
      setAssigning(false);
      return;
    }

    toast.success('Ficha atribuída com sucesso!');
    setAssigningTemplate(null);
    setAssignStudentId("");
    setAssigning(false);
    refetchStudents();
    queryClient.invalidateQueries({ queryKey: ['trainer-students'] });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <TrainerNav />

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold text-foreground">Meus Alunos</h1>
          <Link to="/trainer/plans/new">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} />
              Nova Ficha
            </Button>
          </Link>
        </div>

        <div className="bg-bg2 border border-border rounded-xl p-4 mb-6">
          <div className="text-[12px] font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <UserPlus size={14} />
            Vincular Aluno
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Busque pelo nome do aluno. Alunos já vinculados a outro treinador não podem ser adicionados.
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={linkSearch}
              onChange={e => handleLinkSearchChange(e.target.value)}
              placeholder="Digite o nome do aluno..."
              className="pl-8 text-[13px]"
            />
          </div>

          {linkSearch.trim().length >= 2 && (
            <div className="mt-2 border border-border rounded-lg overflow-hidden">
              {isSearching ? (
                <div className="p-3 text-[12px] text-muted-foreground text-center">Buscando...</div>
              ) : linkResults.length === 0 ? (
                <div className="p-3 text-[12px] text-muted-foreground text-center">Nenhum aluno encontrado.</div>
              ) : (
                linkResults.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleLinkStudent(student.id, student.already_has_trainer)}
                    disabled={linking}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary/5 border-b border-border last:border-0 transition-colors text-left"
                  >
                    <span className="text-[13px] text-foreground">{student.full_name}</span>
                    {student.already_has_trainer ? (
                      <span className="text-[10px] text-workout-orange bg-workout-orange/10 border border-workout-orange/20 rounded px-2 py-0.5 flex-shrink-0">
                        Já tem treinador
                      </span>
                    ) : (
                      <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 flex-shrink-0">
                        Vincular
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
          Alunos vinculados
        </div>

        {students.length === 0 ? (
          <div className="bg-bg2 border border-border rounded-xl p-8 text-center mb-6">
            <div className="text-[36px] mb-3">👥</div>
            <p className="text-[13px] text-muted-foreground">
              Nenhum aluno vinculado ainda. Busque pelo nome acima para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {students.map(student => (
              <Link
                key={student.id}
                to={`/trainer/students/${student.id}`}
                className="bg-bg2 border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 transition-colors block"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[16px] font-semibold text-primary flex-shrink-0">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-foreground">{student.full_name}</div>
                  <div className="text-[11px] text-muted-foreground mt-[2px]">
                    {student.planName ? `Ficha: ${student.planName}` : 'Sem ficha ativa'}
                    {student.lastSession && ` · Último treino: ${new Date(student.lastSession + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Fichas Modelo
          </div>
          <Link to="/trainer/plans/new" className="text-[11px] text-primary hover:underline flex items-center gap-1">
            <Plus size={12} /> Nova modelo
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="bg-bg2 border border-border rounded-xl p-6 text-center mb-6">
            <ClipboardList size={28} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground">
              Nenhuma ficha modelo ainda. Crie uma ficha marcando "Salvar como modelo".
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-bg2 border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground truncate">{tpl.name}</div>
                    {tpl.description && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{tpl.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/trainer/plans/${tpl.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                  <button
                    onClick={() => setAssigningTemplate(tpl)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <UserCheck size={12} /> Atribuir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {assigningTemplate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-bg2 border border-border rounded-2xl w-full max-w-sm p-5">
            <div className="text-[15px] font-semibold text-foreground mb-1">Atribuir ficha</div>
            <div className="text-[12px] text-muted-foreground mb-4">
              Escolha o aluno para receber uma cópia de <strong className="text-foreground">"{assigningTemplate.name}"</strong>
            </div>

            <div className="mb-4">
              <label className="text-[11px] text-muted-foreground block mb-2">Aluno</label>
              {students.length === 0 ? (
                <p className="text-[12px] text-muted-foreground text-center py-3">
                  Nenhum aluno vinculado ainda.
                </p>
              ) : (
                <select
                  value={assignStudentId}
                  onChange={e => setAssignStudentId(e.target.value)}
                  className="w-full bg-bg3 border border-border rounded-lg p-2.5 text-[13px] text-foreground outline-none focus:border-primary"
                >
                  <option value="">Selecione um aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setAssigningTemplate(null); setAssignStudentId(""); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignTemplate}
                disabled={!assignStudentId || assigning}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-50 transition-opacity"
              >
                {assigning ? 'Atribuindo...' : 'Atribuir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
TSX_EOF

echo "▶ Gravando migration SQL..."
mkdir -p supabase/migrations
cat > supabase/migrations/20260601000000_security_fixes.sql <<'SQL_EOF'
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
SQL_EOF

echo "▶ Commit..."
git add src/pages/trainer/TrainerDashboard.tsx supabase/migrations/20260601000000_security_fixes.sql
git commit -m "fix(security): corrige 7 vulnerabilidades de RLS e vinculo de alunos

- Bloqueia escalada de role via trigger BEFORE UPDATE em profiles
- Remove politica Personais podem ver alunos (expunha todos os alunos)
- Restringe visibilidade de perfis a alunos vinculados via trainer_student
- Corrige INSERT de workout_plans: exige vinculo trainer_student
- Migra politicas de logs/sessoes/peso de workout_plans para trainer_student
- Adiciona RPC search_students_for_linking (nome + flag already_has_trainer)
- Revoga EXECUTE anon em todas as funcoes SECURITY DEFINER
- Troca vinculo por ID por busca por nome com bloqueio se ja tem treinador
- Modal de atribuicao usa so alunos ja vinculados"

echo "▶ Push para main..."
git push origin main

echo ""
echo "✅ Código enviado para main."
echo ""
echo "⚠️  PRÓXIMO PASSO: rode o conteúdo de supabase/migrations/20260601000000_security_fixes.sql"
echo "   no SQL Editor do Supabase (o arquivo já está no repositório)."
