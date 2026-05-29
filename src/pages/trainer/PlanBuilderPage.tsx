import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TrainerNav } from "@/components/trainer/TrainerNav";
import { ExerciseFormRow, type ExerciseFormData } from "@/components/trainer/ExerciseFormRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const COLOR_CLASSES = ['primary', 'blue', 'orange', 'teal', 'pink', 'yellow'];
const DAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const SHORT_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const emptyExercise = (): ExerciseFormData => ({
  name: '', muscle: '', sets: 3, reps: '8–12', rest: '2 min',
  rir: '', suggested_load: '', technique: '', description: '', warnings: '',
});

interface DayForm {
  title: string;
  color_class: string;
  tags: string;
  estimated_time: string;
  is_rest: boolean;
  warning_title: string;
  warning_text: string;
  exercises: ExerciseFormData[];
}

const defaultDay = (): DayForm => ({
  title: '', color_class: 'primary', tags: '', estimated_time: '60 min',
  is_rest: false, warning_title: '', warning_text: '', exercises: [emptyExercise()],
});

async function fetchStudents(trainerId: string) {
  const { data: links } = await supabase.from('trainer_student').select('student_id').eq('trainer_id', trainerId);
  if (!links?.length) return [];
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', links.map(l => l.student_id));
  return data ?? [];
}

export default function PlanBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { planId } = useParams();
  const isEdit = !!planId;

  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [studentId, setStudentId] = useState("");
  const [days, setDays] = useState<DayForm[]>(() => Array.from({ length: 7 }, defaultDay));
  const [saving, setSaving] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ['trainer-students-list', user?.id],
    queryFn: () => fetchStudents(user!.id),
    enabled: !!user?.id,
  });

  const updateDay = (i: number, updates: Partial<DayForm>) =>
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, ...updates } : d));

  const addExercise = (dayIdx: number) =>
    setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: [...d.exercises, emptyExercise()] } : d));

  const updateExercise = (dayIdx: number, exIdx: number, data: ExerciseFormData) =>
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d,
      exercises: d.exercises.map((e, j) => j === exIdx ? data : e),
    } : d));

  const removeExercise = (dayIdx: number, exIdx: number) =>
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d,
      exercises: d.exercises.filter((_, j) => j !== exIdx),
    } : d));

  const handleSave = async () => {
    if (!planName.trim()) { toast.error('Dê um nome para a ficha'); return; }
    if (!isTemplate && !studentId) { toast.error('Selecione um aluno ou marque como modelo'); return; }
    if (!user?.id) return;

    setSaving(true);

    try {
      const { data: plan, error: planError } = await supabase.from('workout_plans').insert({
        trainer_id: user.id,
        name: planName.trim(),
        description: planDesc.trim() || null,
        is_active: true,
        is_template: isTemplate,
        ...(isTemplate ? { student_id: null } : { student_id: studentId }),
      }).select('id').single();

      if (planError || !plan) throw planError ?? new Error('Falha ao criar ficha');

      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const d = days[dayIdx];
        const { data: day, error: dayError } = await supabase.from('training_days').insert({
          plan_id: plan.id,
          day_index: dayIdx,
          day_label: DAY_LABELS[dayIdx],
          short_label: SHORT_LABELS[dayIdx],
          title: d.title || (d.is_rest ? 'Descanso' : `Dia ${dayIdx + 1}`),
          color_class: d.color_class,
          tags: d.tags ? d.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          estimated_time: d.estimated_time || null,
          is_rest: d.is_rest,
          warning_title: d.warning_title || null,
          warning_text: d.warning_text || null,
          sort_order: dayIdx,
        }).select('id').single();

        if (dayError || !day) throw dayError ?? new Error('Falha ao criar dia');

        if (!d.is_rest && d.exercises.length > 0) {
          const exercisesToInsert = d.exercises
            .filter(e => e.name.trim())
            .map((e, sortOrder) => ({
              day_id: day.id,
              name: e.name.trim(),
              muscle: e.muscle || null,
              sets: e.sets,
              reps: e.reps,
              rest: e.rest,
              rir: e.rir || null,
              technique: e.technique || null,
              description: e.description || null,
              warnings: e.warnings ? e.warnings.split(',').map(w => w.trim()).filter(Boolean) : [],
              suggested_load: e.suggested_load ? parseFloat(e.suggested_load) : null,
              sort_order: sortOrder,
            }));

          if (exercisesToInsert.length > 0) {
            const { error: exError } = await supabase.from('exercises').insert(exercisesToInsert);
            if (exError) throw exError;
          }
        }
      }

      toast.success('Ficha criada com sucesso!');
      navigate('/trainer');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err?.message ?? 'Tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TrainerNav />

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-24">
        <h1 className="text-[20px] font-semibold text-foreground mb-6">
          {isEdit ? 'Editar Ficha' : 'Nova Ficha de Treino'}
        </h1>

        <div className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <Label>Nome da ficha *</Label>
            <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Ex: PPL Hipertrofia — Fase 1" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input value={planDesc} onChange={e => setPlanDesc(e.target.value)} placeholder="Objetivo, observações gerais..." />
          </div>
          {/* Toggle modelo */}
          <div className="flex items-center justify-between bg-bg2 border border-border rounded-lg p-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">Salvar como modelo</div>
              <div className="text-[11px] text-muted-foreground">Modelo pode ser atribuído a vários alunos depois</div>
            </div>
            <button
              type="button"
              onClick={() => setIsTemplate(v => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative ${isTemplate ? 'bg-primary' : 'bg-bg4 border border-border'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isTemplate ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {!isTemplate && (
          <div className="space-y-1.5">
            <Label>Aluno *</Label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full bg-bg2 border border-border rounded-md p-2 text-[13px] text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="">Selecione um aluno</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
          )}
        </div>

        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-4">
          Configuração dos Dias
        </div>

        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="bg-bg2 border border-border rounded-lg mb-4 overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-foreground">
                  {DAY_LABELS[dayIdx]} ({SHORT_LABELS[dayIdx]})
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.is_rest}
                    onChange={e => updateDay(dayIdx, { is_rest: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-[11px] text-muted-foreground">Descanso</span>
                </label>
              </div>

              {!day.is_rest && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px]">Título do dia</Label>
                    <Input value={day.title} onChange={e => updateDay(dayIdx, { title: e.target.value })} placeholder="Ex: Push A — Peito e Ombro" className="text-[13px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Tempo estimado</Label>
                    <Input value={day.estimated_time} onChange={e => updateDay(dayIdx, { estimated_time: e.target.value })} placeholder="60 min" className="text-[13px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Cor</Label>
                    <select
                      value={day.color_class}
                      onChange={e => updateDay(dayIdx, { color_class: e.target.value })}
                      className="w-full bg-bg3 border border-border rounded-md p-2 text-[13px] text-foreground outline-none"
                    >
                      {COLOR_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px]">Tags (separar por vírgula)</Label>
                    <Input value={day.tags} onChange={e => updateDay(dayIdx, { tags: e.target.value })} placeholder="Peito, Ombro, Tríceps" className="text-[13px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Título do alerta (opcional)</Label>
                    <Input value={day.warning_title} onChange={e => updateDay(dayIdx, { warning_title: e.target.value })} placeholder="Atenção" className="text-[13px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Texto do alerta</Label>
                    <Input value={day.warning_text} onChange={e => updateDay(dayIdx, { warning_text: e.target.value })} placeholder="Mensagem..." className="text-[13px]" />
                  </div>
                </div>
              )}
            </div>

            {!day.is_rest && (
              <div className="p-4">
                <div className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Exercícios ({day.exercises.length})
                </div>
                {day.exercises.map((ex, exIdx) => (
                  <ExerciseFormRow
                    key={exIdx}
                    index={exIdx}
                    value={ex}
                    onChange={(_, data) => updateExercise(dayIdx, exIdx, data)}
                    onRemove={() => removeExercise(dayIdx, exIdx)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addExercise(dayIdx)}
                  className="w-full border border-dashed border-border rounded-lg p-3 text-[12px] text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Adicionar exercício
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Ficha'}
          </Button>
        </div>
      </div>
    </div>
  );
}
