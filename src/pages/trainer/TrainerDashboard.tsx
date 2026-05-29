import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserPlus, ChevronRight, Copy, BookCopy } from "lucide-react";
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

interface ProfileInfo {
  id: string;
  full_name: string;
}

interface TemplateInfo {
  id: string;
  name: string;
  description: string | null;
}

async function fetchLinkedStudents(trainerId: string): Promise<StudentInfo[]> {
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

async function fetchAllStudentProfiles(): Promise<ProfileInfo[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .order('full_name');
  return data ?? [];
}

async function fetchTemplates(trainerId: string): Promise<TemplateInfo[]> {
  const { data } = await supabase
    .from('workout_plans')
    .select('id, name, description')
    .eq('trainer_id', trainerId)
    .eq('is_template', true)
    .order('name');
  return data ?? [];
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [manualId, setManualId] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<TemplateInfo | null>(null);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const { data: students = [], refetch: refetchStudents } = useQuery({
    queryKey: ['trainer-linked-students', user?.id],
    queryFn: () => fetchLinkedStudents(user!.id),
    enabled: !!user?.id,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-student-profiles'],
    queryFn: fetchAllStudentProfiles,
    enabled: !!user?.id,
  });

  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['trainer-templates', user?.id],
    queryFn: () => fetchTemplates(user!.id),
    enabled: !!user?.id,
  });

  const linkedIds = new Set(students.map(s => s.id));
  const availableToLink = allProfiles.filter(p => !linkedIds.has(p.id));

  const handleLink = async (studentId: string) => {
    if (!user?.id || !studentId.trim()) return;
    setLinkingId(studentId);
    const { error } = await supabase.from('trainer_student').insert({
      trainer_id: user.id,
      student_id: studentId.trim(),
    });
    setLinkingId(null);
    if (error) {
      toast.error('Erro ao vincular: ' + error.message);
    } else {
      toast.success('Aluno vinculado!');
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ['all-student-profiles'] });
      setManualId("");
    }
  };

  const handleAssignTemplate = async () => {
    if (!assignModal || !assignStudentId || !user?.id) return;
    setAssigning(true);

    // Busca os dados completos do template
    const { data: tpl } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('id', assignModal.id)
      .single();

    if (!tpl) { toast.error('Modelo não encontrado'); setAssigning(false); return; }

    // Cria uma cópia do plano para o aluno
    const { data: newPlan, error: planErr } = await supabase
      .from('workout_plans')
      .insert({
        trainer_id: user.id,
        student_id: assignStudentId,
        name: tpl.name,
        description: tpl.description,
        is_active: true,
        is_template: false,
      })
      .select('id')
      .single();

    if (planErr || !newPlan) { toast.error('Erro ao criar ficha'); setAssigning(false); return; }

    // Copia os dias e exercícios
    const { data: days } = await supabase
      .from('training_days')
      .select('*')
      .eq('plan_id', assignModal.id)
      .order('sort_order');

    for (const day of days ?? []) {
      const { data: newDay } = await supabase
        .from('training_days')
        .insert({
          plan_id: newPlan.id,
          day_index: day.day_index,
          day_label: day.day_label,
          short_label: day.short_label,
          title: day.title,
          color_class: day.color_class,
          tags: day.tags,
          estimated_time: day.estimated_time,
          is_rest: day.is_rest,
          warning_title: day.warning_title,
          warning_text: day.warning_text,
          sort_order: day.sort_order,
        })
        .select('id')
        .single();

      if (!newDay) continue;

      const { data: exs } = await supabase
        .from('exercises')
        .select('*')
        .eq('day_id', day.id)
        .order('sort_order');

      if (exs && exs.length > 0) {
        await supabase.from('exercises').insert(
          exs.map(e => ({
            day_id: newDay.id,
            name: e.name, muscle: e.muscle, sets: e.sets, reps: e.reps,
            rest: e.rest, rir: e.rir, technique: e.technique,
            description: e.description, warnings: e.warnings,
            suggested_load: e.suggested_load, sort_order: e.sort_order,
          }))
        );
      }
    }

    toast.success('Ficha atribuída com sucesso!');
    setAssigning(false);
    setAssignModal(null);
    setAssignStudentId("");
    refetchStudents();
    navigate(`/trainer/students/${assignStudentId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TrainerNav />

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold text-foreground">Dashboard</h1>
          <Link to="/trainer/plans/new">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} /> Nova Ficha
            </Button>
          </Link>
        </div>

        {/* ── Meus Alunos ── */}
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
          Meus Alunos ({students.length})
        </div>

        {students.length === 0 ? (
          <div className="bg-bg2 border border-border rounded-lg p-6 text-center mb-6">
            <div className="text-[36px] mb-2">👥</div>
            <p className="text-[13px] text-muted-foreground">Nenhum aluno vinculado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {students.map(student => (
              <Link
                key={student.id}
                to={`/trainer/students/${student.id}`}
                className="bg-bg2 border border-border rounded-lg p-4 flex items-center gap-3 hover:border-primary/40 transition-colors block"
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

        {/* ── Modelos de Ficha ── */}
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3 mt-2">
          Modelos de Ficha ({templates.length})
        </div>

        {templates.length === 0 ? (
          <div className="bg-bg2 border border-dashed border-border rounded-lg p-4 text-center mb-6">
            <p className="text-[12px] text-muted-foreground">
              Nenhum modelo salvo. Ao criar uma ficha, marque "Salvar como modelo" para reutilizá-la com vários alunos.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-bg2 border border-border rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookCopy size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-foreground">{tpl.name}</div>
                  {tpl.description && (
                    <div className="text-[11px] text-muted-foreground mt-[2px] truncate">{tpl.description}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/trainer/plans/${tpl.id}`)}
                    className="text-[11px] border border-border rounded-[6px] px-3 py-1.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { setAssignModal(tpl); setAssignStudentId(""); }}
                    className="text-[11px] bg-primary/20 text-primary border border-primary/30 rounded-[6px] px-3 py-1.5 font-medium hover:bg-primary/30 transition-colors"
                  >
                    Atribuir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alunos disponíveis para vincular ── */}
        {availableToLink.length > 0 && (
          <>
            <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
              Alunos cadastrados — clique para vincular
            </div>
            <div className="space-y-2 mb-6">
              {availableToLink.map(p => (
                <div key={p.id} className="bg-bg2 border border-border rounded-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-bg4 flex items-center justify-center text-[14px] font-semibold text-muted-foreground flex-shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{p.full_name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/60 truncate">{p.id}</div>
                  </div>
                  <button
                    onClick={() => handleLink(p.id)}
                    disabled={linkingId === p.id}
                    className="text-[11px] border border-border rounded-[6px] px-3 py-1.5 text-muted-foreground hover:text-primary hover:border-primary transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    {linkingId === p.id ? '...' : 'Vincular'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Vincular por ID manual ── */}
        <div className="bg-bg2 border border-border rounded-lg p-4">
          <div className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <UserPlus size={14} /> Vincular por ID
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            O aluno encontra o ID dele na aba Perfil → "Copiar ID".
          </p>
          <div className="flex gap-2">
            <Input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="Cole o ID (UUID) do aluno" className="flex-1 text-[13px]" />
            <Button size="sm" onClick={() => handleLink(manualId)} disabled={!manualId.trim() || linkingId === manualId}>
              Vincular
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de atribuição de modelo */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-bg2 border border-border rounded-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-foreground mb-1">Atribuir modelo</h2>
            <p className="text-[12px] text-muted-foreground mb-4">
              Uma cópia de <strong>{assignModal.name}</strong> será criada e atribuída ao aluno selecionado.
            </p>
            <div className="space-y-1 mb-4">
              <label className="text-[11px] text-muted-foreground">Selecione o aluno</label>
              <select
                value={assignStudentId}
                onChange={e => setAssignStudentId(e.target.value)}
                className="w-full bg-bg3 border border-border rounded-md p-2 text-[13px] text-foreground outline-none focus:border-primary"
              >
                <option value="">Escolha um aluno...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAssignTemplate} disabled={!assignStudentId || assigning} className="flex-1">
                {assigning ? 'Atribuindo...' : 'Atribuir ficha'}
              </Button>
              <Button variant="outline" onClick={() => setAssignModal(null)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
