import { useQueries, useQuery } from "@tanstack/react-query";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Area,
  AreaChart,
  ReferenceDot,
} from "recharts";
import { TrendingDown, TrendingUp, Trophy, Scale, BarChart3 } from "lucide-react";
import { PerformanceView } from "@/components/workout/PerformanceView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  loadBodyWeightHistory,
  getLatestBodyWeight,
  getWeightChange,
} from "@/lib/bodyWeight";
import { getTopSetHistory, getVolumeHistory } from "@/lib/storage";
import type { DbWorkoutPlan, DbExercise } from "@/types/plan";

interface EvolutionPageProps {
  studentId: string;
  plan: DbWorkoutPlan | null | undefined;
  onOpenWeighIn?: () => void;
}

const PURPLE = "hsl(var(--primary))";
const LIME = "hsl(var(--lime))";

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
      <Icon size={14} />
    </div>
    <div>
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foreground">{title}</div>
      <div className="text-[10px] text-muted-foreground">{subtitle}</div>
    </div>
  </div>
);

// ───────────────── Peso corporal ─────────────────
function BodyWeightSection({ studentId, onOpenWeighIn }: { studentId: string; onOpenWeighIn?: () => void }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["body-weight-history", studentId],
    queryFn: () => loadBodyWeightHistory(studentId),
    staleTime: 5 * 60_000,
  });
  const { data: latest } = useQuery({
    queryKey: ["latest-body-weight", studentId],
    queryFn: () => getLatestBodyWeight(studentId),
  });
  const { data: change } = useQuery({
    queryKey: ["weight-change", studentId],
    queryFn: () => getWeightChange(studentId),
  });

  // últimas 8 semanas
  const cutoff = Date.now() - 8 * 7 * 24 * 60 * 60 * 1000;
  const recent = history.filter(e => new Date(e.date + "T12:00:00").getTime() >= cutoff);
  const chartData = recent.map((e, i) => ({
    date: new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
    peso: e.weight,
    isLast: i === recent.length - 1,
  }));
  const lastPoint = chartData[chartData.length - 1];

  return (
    <div className="bg-bg2 border border-border rounded-xl p-4">
      <SectionHeader icon={Scale} title="Peso corporal" subtitle="Últimas 8 semanas" />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : recent.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[12px] text-muted-foreground mb-3">Nenhum registro de peso ainda.</p>
          {onOpenWeighIn && (
            <Button size="sm" onClick={onOpenWeighIn}>Registrar peso</Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-3">
            <div className="text-stat font-mono text-foreground leading-none">
              {latest?.weight ?? recent[recent.length - 1].weight}
              <span className="text-[14px] text-muted-foreground ml-1 font-sans font-normal">kg</span>
            </div>
            {change && (
              <div
                className={`flex items-center gap-1 text-[12px] font-mono ${
                  change.change < 0 ? "text-[hsl(var(--lime))]" : "text-muted-foreground"
                }`}
              >
                {change.change < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {change.change > 0 ? "+" : ""}
                {change.change} kg
              </div>
            )}
          </div>

          {recent.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} unit="kg" width={42} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--bg3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v} kg`, "Peso"]}
                />
                <Area type="monotone" dataKey="peso" stroke={PURPLE} strokeWidth={2} fill="url(#weightFill)" />
                {lastPoint && (
                  <ReferenceDot x={lastPoint.date} y={lastPoint.peso} r={5} fill={LIME} stroke={LIME} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[12px] text-muted-foreground text-center py-4">
              Registre mais um peso para ver a evolução 📊
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ───────────────── Volume semanal ─────────────────
function getMondayKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function WeeklyVolumeSection({ studentId, exercises }: { studentId: string; exercises: DbExercise[] }) {
  const results = useQueries({
    queries: exercises.map(ex => ({
      queryKey: ["volume-history", ex.id, studentId],
      queryFn: () => getVolumeHistory(ex.id, studentId),
      staleTime: 5 * 60_000,
    })),
  });

  const isLoading = results.some(r => r.isLoading);
  const allData = results.flatMap(r => r.data ?? []);

  // agrupar por semana (segunda)
  const map = new Map<string, number>();
  for (const entry of allData) {
    const key = getMondayKey(entry.date);
    map.set(key, (map.get(key) ?? 0) + entry.volume);
  }

  // últimas 7 semanas até a semana atual
  const todayMonday = getMondayKey(new Date().toISOString().split("T")[0]);
  const weeks: { weekKey: string; label: string; volume: number; isCurrent: boolean }[] = [];
  const base = new Date(todayMonday + "T12:00:00");
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i * 7);
    const key = d.toISOString().split("T")[0];
    weeks.push({
      weekKey: key,
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      volume: Math.round(map.get(key) ?? 0),
      isCurrent: key === todayMonday,
    });
  }

  const hasAny = weeks.some(w => w.volume > 0);

  return (
    <div className="bg-bg2 border border-border rounded-xl p-4">
      <SectionHeader icon={BarChart3} title="Volume semanal" subtitle="Carga total por semana (kg)" />
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !hasAny ? (
        <p className="text-[12px] text-muted-foreground text-center py-6">
          Ainda sem sessões registradas. Treine e volte aqui 💪
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeks} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="barCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(270 80% 40%)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }} axisLine={false} tickLine={false} width={42} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--bg3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`${v.toLocaleString("pt-BR")} kg`, "Volume"]}
            />
            <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
              {weeks.map((w, i) => (
                <Cell
                  key={i}
                  fill={w.isCurrent ? "url(#barCurrent)" : PURPLE}
                  fillOpacity={w.isCurrent ? 1 : 0.35}
                  style={w.isCurrent ? { filter: `drop-shadow(0 0 6px hsl(var(--primary) / 0.6))` } : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ───────────────── Recordes pessoais ─────────────────
function PersonalRecordsSection({ studentId, exercises }: { studentId: string; exercises: DbExercise[] }) {
  const results = useQueries({
    queries: exercises.map(ex => ({
      queryKey: ["top-set-history", ex.id, studentId],
      queryFn: () => getTopSetHistory(ex.id, studentId),
      staleTime: 5 * 60_000,
    })),
  });

  const isLoading = results.some(r => r.isLoading);

  const records = exercises
    .map((ex, i) => {
      const history = results[i].data ?? [];
      if (history.length === 0) return null;
      const best = history.reduce((a, b) => (b.weight > a.weight ? b : a));
      const isRecent = (() => {
        if (history.length < 2) return true;
        const last = history[history.length - 1];
        return last.weight === best.weight && last.date === best.date;
      })();
      return {
        id: ex.id,
        name: ex.name,
        weight: best.weight,
        reps: best.reps,
        date: best.date,
        isRecent,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="bg-bg2 border border-border rounded-xl p-4">
      <SectionHeader icon={Trophy} title="Recordes pessoais" subtitle="Melhores cargas registradas" />
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : records.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-6">
          Nenhum recorde registrado ainda 🏆
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {records.map(r => (
            <li key={r.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0 flex-1 pr-3">
                <div className="text-[13px] text-foreground truncate flex items-center gap-1.5">
                  {r.name}
                  {r.isRecent && <TrendingUp size={12} className="text-[hsl(var(--lime))] shrink-0" />}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {r.reps} reps · {new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
                </div>
              </div>
              <div
                className={`font-mono text-[15px] font-semibold ${
                  r.isRecent ? "text-[hsl(var(--lime))]" : "text-foreground"
                }`}
              >
                {r.weight}
                <span className="text-[11px] text-muted-foreground ml-0.5">kg</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ───────────────── Page ─────────────────
export function EvolutionPage({ studentId, plan, onOpenWeighIn }: EvolutionPageProps) {
  const exercises: DbExercise[] = (plan?.training_days ?? [])
    .flatMap(d => d.exercises ?? [])
    .filter(e => !!e?.id);

  return (
    <div className="space-y-4 pb-4">
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Evolução
      </div>

      <BodyWeightSection studentId={studentId} onOpenWeighIn={onOpenWeighIn} />
      <WeeklyVolumeSection studentId={studentId} exercises={exercises} />
      <PersonalRecordsSection studentId={studentId} exercises={exercises} />

      <div className="bg-bg2 border border-border rounded-xl p-4">
        <SectionHeader icon={TrendingUp} title="Evolução de cargas" subtitle="Por exercício" />
        <PerformanceView studentId={studentId} plan={plan} />
      </div>
    </div>
  );
}
