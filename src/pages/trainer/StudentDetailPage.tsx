import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TrainerNav } from "@/components/trainer/TrainerNav";
import { PerformanceView } from "@/components/workout/PerformanceView";
import { Edit3 } from "lucide-react";

async function fetchStudentProfile(studentId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', studentId).single();
  return data;
}

async function fetchStudentPlanFull(studentId: string) {
  const { data: plan } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!plan) return null;

  const { data: days } = await supabase.from('training_days').select('*').eq('plan_id', plan.id).order('sort_order');
  if (!days) return { ...plan, training_days: [] };

  const dayIds = days.map(d => d.id);
  const { data: exercises } = await supabase.from('exercises').select('*').in('day_id', dayIds).order('sort_order');

  return {
    ...plan,
    training_days: days.map(d => ({
      ...d,
      exercises: (exercises ?? []).filter(e => e.day_id === d.id),
    })),
  };
}

async function fetchRecentSessions(studentId: string) {
  const { data } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false })
    .limit(7);
  return data ?? [];
}

type TabKey = 'overview' | 'performance' | 'plan';

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [tab, setTab] = useState<TabKey>('overview');

  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: () => fetchStudentProfile(studentId!),
    enabled: !!studentId,
  });

  const { data: plan } = useQuery({
    queryKey: ['student-plan-full', studentId],
    queryFn: () => fetchStudentPlanFull(studentId!),
    enabled: !!studentId,
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: ['student-recent-sessions', studentId],
    queryFn: () => fetchRecentSessions(studentId!),
    enabled: !!studentId,
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'performance', label: 'Performance' },
    { key: 'plan', label: 'Ficha' },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <TrainerNav />

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full">
        <div className="p-4 border-b border-border">
          <Link to="/trainer" className="text-[12px] text-muted-foreground hover:text-foreground mb-3 block">← Voltar</Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-[18px] font-semibold text-primary">
              {studentProfile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="text-[17px] font-semibold text-foreground">{studentProfile?.full_name ?? 'Carregando...'}</div>
              <div className="text-[12px] text-muted-foreground">{plan?.name ?? 'Sem ficha ativa'}</div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-[12px] font-medium transition-colors ${
                tab === t.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'overview' && (
            <div>
              <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
                Últimas 7 sessões
              </div>
              {recentSessions.length === 0 ? (
                <div className="bg-bg2 border border-border rounded-lg p-6 text-center">
                  <p className="text-[13px] text-muted-foreground">Nenhuma sessão registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((s: any, i: number) => {
                    const pct = s.total_exercises > 0 ? Math.round((s.exercises_completed / s.total_exercises) * 100) : 0;
                    return (
                      <div key={i} className="bg-bg2 border border-border rounded-lg p-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-mono font-semibold ${
                          pct === 100 ? 'bg-primary/20 text-primary' : 'bg-bg4 text-muted-foreground'
                        }`}>
                          {pct}%
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-foreground">{s.day_title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(s.session_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' · '}{s.exercises_completed}/{s.total_exercises} exercícios
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'performance' && (
            <PerformanceView studentId={studentId!} plan={plan ?? null} />
          )}

          {tab === 'plan' && (
            <div>
              {plan ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[15px] font-semibold text-foreground">{plan.name}</h3>
                      {plan.description && <p className="text-[12px] text-muted-foreground mt-1">{plan.description}</p>}
                    </div>
                    <Link to={`/trainer/plans/${plan.id}`} className="p-2 rounded text-muted-foreground hover:text-primary transition-colors">
                      <Edit3 size={16} />
                    </Link>
                  </div>
                  {plan.training_days?.map((d: any) => (
                    <div key={d.id} className="bg-bg2 border border-border rounded-lg p-3 mb-2">
                      <div className="text-[13px] font-medium text-foreground">{d.short_label} — {d.title}</div>
                      {!d.is_rest && (
                        <div className="mt-2 space-y-1">
                          {d.exercises.map((ex: any) => (
                            <div key={ex.id} className="text-[12px] text-muted-foreground">
                              {ex.name} · {ex.sets}×{ex.reps}
                              {ex.suggested_load ? ` · ${ex.suggested_load}kg sug.` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="bg-bg2 border border-border rounded-lg p-6 text-center">
                  <p className="text-[13px] text-muted-foreground mb-3">Nenhuma ficha ativa atribuída.</p>
                  <Link to="/trainer/plans/new" className="text-primary text-[13px] underline">Criar nova ficha</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
