import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserPlus, ChevronRight, ClipboardList, Edit2, UserCheck } from "lucide-react";
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

async function fetchAllStudents(): Promise<{ id: string; full_name: string }[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .order('full_name');
  return data ?? [];
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [linkId, setLinkId] = useState("");
  const [linking, setLinking] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState<TemplatePlan | null>(null);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const { data: students = [], refetch: refetchStudents } = useQuery({
    queryKey: ['trainer-students', user?.id],
    queryFn: () => fetchStudents(user!.id),
    enabled: !!user?.id,
  });

  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['trainer-templates', user?.id],
    queryFn: () => fetchTemplates(user!.id),
    enabled: !!user?.id,
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students'],
    queryFn: fetchAllStudents,
    enabled: !!assigningTemplate,
  });

  const handleLinkById = async () => {
    if (!user?.id || !linkId.trim()) return;
    setLinking(true);
    const { error } = await supabase.from('trainer_student').insert({
      trainer_id: user.id,
      student_id: linkId.trim(),
    });
    setLinking(false);
    if (error) {
      toast.error('Erro ao vincular: ' + error.message);
    } else {
      toast.success('Aluno vinculado!');
      refetchStudents();
      setLinkId("");
    }
  };

  const handleAssignTemplate = async () => {
    if (!assigningTemplate || !assignStudentId || !user?.id) return;
    setAssigning(true);

    // Copia o plano template para o aluno selecionado
    const { data: newPlan, error: planErr } = await supabase
      .from('workout_plans')
      .insert({
        trainer_id: user.id,
        student_id: assignStudentId,
        name: assigningTemplate.name,
        description: assigningTemplate.description,
        is_active: true,
        is_template: false,
      })
      .select()
      .single();

    if (planErr || !newPlan) {
      toast.error('Erro ao atribuir ficha');
      setAssigning(false);
      return;
    }

    // Copia os dias e exercícios
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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold text-foreground">Meus Alunos</h1>
          <Link to="/trainer/plans/new">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} />
              Nova Ficha
            </Button>
          </Link>
        </div>

        {/* Vincular aluno */}
        <div className="bg-bg2 border border-border rounded-xl p-4 mb-6">
          <div className="text-[12px] font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <UserPlus size={14} />
            Vincular Aluno
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Cole o ID do aluno (disponível na tela de Perfil dele).
          </p>
          <div className="flex gap-2">
            <Input
              value={linkId}
              onChange={e => setLinkId(e.target.value)}
              placeholder="ID do aluno (UUID)"
              className="flex-1 text-[13px]"
            />
            <Button size="sm" onClick={handleLinkById} disabled={linking || !linkId.trim()}>
              Vincular
            </Button>
          </div>
        </div>

        {/* Lista de alunos */}
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
          Alunos vinculados
        </div>

        {students.length === 0 ? (
          <div className="bg-bg2 border border-border rounded-xl p-8 text-center mb-6">
            <div className="text-[36px] mb-3">👥</div>
            <p className="text-[13px] text-muted-foreground">
              Nenhum aluno vinculado ainda. Cole o ID acima para começar.
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

        {/* Fichas Modelo */}
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

      {/* Modal de atribuição */}
      {assigningTemplate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-bg2 border border-border rounded-2xl w-full max-w-sm p-5">
            <div className="text-[15px] font-semibold text-foreground mb-1">Atribuir ficha</div>
            <div className="text-[12px] text-muted-foreground mb-4">
              Escolha o aluno para receber uma cópia de <strong className="text-foreground">"{assigningTemplate.name}"</strong>
            </div>

            <div className="mb-4">
              <label className="text-[11px] text-muted-foreground block mb-2">Aluno</label>
              <select
                value={assignStudentId}
                onChange={e => setAssignStudentId(e.target.value)}
                className="w-full bg-bg3 border border-border rounded-lg p-2.5 text-[13px] text-foreground outline-none focus:border-primary"
              >
                <option value="">Selecione um aluno...</option>
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
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
