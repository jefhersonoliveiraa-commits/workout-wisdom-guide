import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopSetHistory, getVolumeHistory, getExerciseSessions } from "@/lib/storage";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import type { DbWorkoutPlan, DbTrainingDay } from "@/types/plan";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

interface PerformanceViewProps {
  studentId: string;
  plan: DbWorkoutPlan | null | undefined;
}

// Mini sparkline sem eixos para os cards
function Sparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}
          dot={false} activeDot={{ r: 3, fill: color }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Card de exercício com sparkline e expansível
function ExercisePerformanceCard({ exerciseId, exerciseName, studentId }: {
  exerciseId: string;
  exerciseName: string;
  studentId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"top" | "volume">("top");

  const { data: topHistory = [] } = useQuery({
    queryKey: ['top-set-history', exerciseId, studentId],
    queryFn: () => getTopSetHistory(exerciseId, studentId),
    staleTime: 5 * 60_000,
  });

  const { data: volHistory = [] } = useQuery({
    queryKey: ['volume-history', exerciseId, studentId],
    queryFn: () => getVolumeHistory(exerciseId, studentId),
    staleTime: 5 * 60_000,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['exercise-sessions', exerciseId, studentId],
    queryFn: () => getExerciseSessions(exerciseId, studentId),
    enabled: expanded,
    staleTime: 5 * 60_000,
  });

  const topData = topHistory.map(e => ({
    date: new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    peso: e.weight, reps: e.reps,
  }));

  const volData = volHistory.map(e => ({
    date: new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    volume: Math.round(e.volume),
  }));

  const activeData = mode === "top" ? topData : volData;
  const activeKey = mode === "top" ? "peso" : "volume";
  const activeUnit = mode === "top" ? "kg" : "";
  const hasData = topHistory.length > 0;

  // Tendência: compara últimas 2 sessões
  const trend = (() => {
    if (topHistory.length < 2) return null;
    const last = topHistory[topHistory.length - 1].weight;
    const prev = topHistory[topHistory.length - 2].weight;
    if (last > prev) return "up";
    if (last < prev) return "down";
    return "flat";
  })();

  const latestWeight = topHistory.length > 0 ? topHistory[topHistory.length - 1].weight : null;
  const latestReps = topHistory.length > 0 ? topHistory[topHistory.length - 1].reps : null;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
      hasData ? 'bg-bg2 border-border' : 'bg-bg2/50 border-border/50'
    }`}>
      {/* Header clicável */}
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => hasData && setExpanded(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] font-medium truncate ${hasData ? 'text-foreground' : 'text-muted-foreground'}`}>
            {exerciseName}
          </div>
          {hasData ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-primary">{latestWeight}kg × {latestReps}</span>
              <span className="text-[10px] text-muted-foreground">· {topHistory.length} sessões</span>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground/50 mt-0.5">Sem registros ainda</div>
          )}
        </div>

        {hasData && (
          <>
            {/* Mini sparkline */}
            <div className="w-[80px] flex-shrink-0">
              <Sparkline data={topData} dataKey="peso" color="hsl(79 88% 62%)" />
            </div>

            {/* Trend indicator */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
              trend === 'up' ? 'bg-primary/20 text-primary' :
              trend === 'down' ? 'bg-red-500/20 text-red-400' :
              'bg-bg4 text-muted-foreground'
            }`}>
              {trend === 'up' ? <TrendingUp size={13} /> :
               trend === 'down' ? <TrendingDown size={13} /> :
               <Minus size={13} />}
            </div>

            <div className="text-muted-foreground flex-shrink-0">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </>
        )}
      </button>

      {/* Expansível: chart completo + histórico */}
      {expanded && hasData && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* Toggle top set / volume */}
          <div className="flex gap-2 mb-4">
            {(["top", "volume"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 text-[11px] py-2 rounded-lg border font-medium transition-colors ${
                  mode === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-bg3 text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {m === 'top' ? 'Top set (kg)' : 'Volume total'}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={activeData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }}
                axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }}
                axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }} tickLine={false}
                unit={activeUnit} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 11.8%)", border: "1px solid hsl(0 0% 100% / 0.14)", borderRadius: "8px", fontSize: "12px", color: "hsl(0 0% 94.1%)" }}
                formatter={(v: number) => [`${v}${activeUnit}`, mode === 'top' ? 'Carga' : 'Volume']}
              />
              <Line type="monotone" dataKey={activeKey} stroke="hsl(79 88% 62%)" strokeWidth={2.5}
                dot={{ fill: "hsl(79 88% 62%)", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "hsl(79 88% 62%)" }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Últimas sessões */}
          {sessions.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Últimas sessões
              </div>
              {sessions.slice(0, 5).map((s, i) => (
                <div key={i} className="bg-bg3 rounded-lg p-2.5">
                  <div className="text-[11px] text-muted-foreground mb-1.5">
                    {new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.sets.map((set, j) => (
                      <span key={j} className={`text-[11px] font-mono rounded-md px-2 py-1 ${
                        set.weight > 0
                          ? 'bg-primary/10 border border-primary/25 text-primary'
                          : 'bg-bg4 border border-border text-muted-foreground/40'
                      }`}>
                        {set.weight > 0 ? `${set.weight}×${set.reps}` : '—'}
                      </span>
                    ))}
                  </div>
                  {s.observation && (
                    <p className="text-[11px] text-muted-foreground/70 mt-1.5 italic">"{s.observation}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PerformanceView({ studentId, plan }: PerformanceViewProps) {
  const trainingDays = plan?.training_days.filter(d => !d.is_rest) ?? [];
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (trainingDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-[36px] mb-3">📊</div>
        <p className="text-[13px] text-muted-foreground">Nenhuma ficha ativa com exercícios.</p>
      </div>
    );
  }

  const selectedDay = trainingDays[selectedDayIndex];

  return (
    <div>
      {/* Seletor de treino (dia) — scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {trainingDays.map((day, i) => (
          <button
            key={day.id}
            onClick={() => setSelectedDayIndex(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-medium border transition-all ${
              selectedDayIndex === i
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-bg2 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {day.short_label} — {day.title}
          </button>
        ))}
      </div>

      {/* Resumo do dia selecionado */}
      <div className="bg-bg2 border border-border rounded-xl p-3 mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-foreground">{selectedDay.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {selectedDay.exercises.length} exercícios · toque para ver evolução
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground bg-bg4 rounded-md px-2 py-1 border border-border">
          {selectedDay.tags?.slice(0, 2).join(' · ') ?? ''}
        </div>
      </div>

      {/* Cards de exercícios */}
      <div className="space-y-2">
        {selectedDay.exercises.map(ex => (
          <ExercisePerformanceCard
            key={ex.id}
            exerciseId={ex.id}
            exerciseName={ex.name}
            studentId={studentId}
          />
        ))}
      </div>
    </div>
  );
}
