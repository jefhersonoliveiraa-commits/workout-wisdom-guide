import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopSetHistory, getVolumeHistory, getExerciseSessions } from "@/lib/storage";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DbWorkoutPlan } from "@/types/plan";

interface EvolutionPageProps {
  studentId: string;
  plan: DbWorkoutPlan | null | undefined;
}

export function EvolutionPage({ studentId, plan }: EvolutionPageProps) {
  const allExercises = plan?.training_days
    .filter(d => !d.is_rest)
    .flatMap(d => d.exercises.map(e => ({ ...e, dayTitle: d.title }))) ?? [];

  const firstId = allExercises[0]?.id ?? "";
  const [selectedExercise, setSelectedExercise] = useState(firstId);
  const [mode, setMode] = useState<"top" | "volume">("top");

  const { data: topHistory = [] } = useQuery({
    queryKey: ['top-set-history', selectedExercise, studentId],
    queryFn: () => getTopSetHistory(selectedExercise, studentId),
    enabled: !!selectedExercise,
  });

  const { data: volHistory = [] } = useQuery({
    queryKey: ['volume-history', selectedExercise, studentId],
    queryFn: () => getVolumeHistory(selectedExercise, studentId),
    enabled: !!selectedExercise,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['exercise-sessions', selectedExercise, studentId],
    queryFn: () => getExerciseSessions(selectedExercise, studentId),
    enabled: !!selectedExercise,
  });

  const topData = topHistory.map(e => ({
    date: new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
    peso: e.weight,
    reps: e.reps,
  }));

  const volData = volHistory.map(e => ({
    date: new Date(e.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
    volume: Math.round(e.volume),
  }));

  const exerciseName = allExercises.find(e => e.id === selectedExercise)?.name ?? "";
  const data = mode === "top" ? topData : volData;
  const dataKey = mode === "top" ? "peso" : "volume";
  const unit = mode === "top" ? "kg" : "";

  const groupedByDay = plan?.training_days
    .filter(d => !d.is_rest)
    .map(d => ({ dayTitle: `${d.short_label} — ${d.title}`, exercises: d.exercises })) ?? [];

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Evolução de cargas
      </div>

      <div className="bg-bg2 border border-border rounded-lg p-3 mb-3">
        <label className="text-[11px] text-muted-foreground block mb-2">Exercício:</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-bg3 border border-border rounded-sm p-2 text-[13px] text-foreground outline-none focus:border-primary transition-colors"
        >
          {groupedByDay.map(group => (
            <optgroup key={group.dayTitle} label={group.dayTitle}>
              {group.exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setMode("top")}
            className={`flex-1 text-[11px] py-2 rounded-[6px] border transition-colors ${
              mode === "top" ? "bg-primary/20 text-primary border-primary/40" : "bg-bg3 text-muted-foreground border-border"
            }`}
          >
            Top set (kg)
          </button>
          <button
            onClick={() => setMode("volume")}
            className={`flex-1 text-[11px] py-2 rounded-[6px] border transition-colors ${
              mode === "volume" ? "bg-primary/20 text-primary border-primary/40" : "bg-bg3 text-muted-foreground border-border"
            }`}
          >
            Volume total
          </button>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="bg-bg2 border border-border rounded-lg p-4 mb-4">
          <h3 className="text-[13px] font-medium text-foreground mb-1">{exerciseName}</h3>
          <p className="text-[11px] text-muted-foreground mb-4">{data.length} sessões registradas</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0 0% 40%)" }} axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 40%)" }} axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }} tickLine={false} unit={unit} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 11.8%)", border: "1px solid hsl(0 0% 100% / 0.14)", borderRadius: "8px", fontSize: "12px", color: "hsl(0 0% 94.1%)" }} />
              <Line type="monotone" dataKey={dataKey} stroke="hsl(79 88% 62%)" strokeWidth={2} dot={{ fill: "hsl(79 88% 62%)", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-bg2 border border-border rounded-lg p-6 text-center mb-4">
          <div className="text-[28px] mb-2">📊</div>
          <p className="text-[13px] text-muted-foreground">
            Sem registros para este exercício. Abra-o durante o treino e preencha carga + reps de cada série.
          </p>
        </div>
      )}

      {sessions.slice(0, 8).map((s, i) => (
        <div key={i} className="bg-bg2 border border-border rounded-lg p-3 mb-2">
          <div className="text-[12px] font-medium text-foreground mb-1">
            {new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {s.sets.map((set, j) => (
              <span
                key={j}
                className={`text-[11px] font-mono rounded-[6px] px-2 py-1 border ${
                  set.weight > 0
                    ? "bg-primary/[0.08] border-primary/30 text-primary"
                    : "bg-bg4 border-border text-muted-foreground/50"
                }`}
              >
                {set.weight > 0 ? `${set.weight}kg × ${set.reps}` : "—"}
              </span>
            ))}
          </div>
          {s.observation && (
            <p className="text-[11px] text-muted-foreground mt-2 italic">"{s.observation}"</p>
          )}
        </div>
      ))}

      <div className="bg-bg2 border border-border rounded-lg p-4 mt-2">
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2">
          Como progredir (Dupla Progressão)
        </div>
        <ul className="list-disc pl-4 text-[12px] text-muted-foreground leading-[1.7] space-y-1">
          <li>Trabalhe na faixa de reps prescrita com o RIR alvo</li>
          <li>Quando bater o TOPO da faixa em todas as séries, suba 2–5%</li>
          <li>Volte para o piso da faixa com a nova carga</li>
          <li>Travou 2 semanas? Reveja sono, alimentação ou troque o exercício</li>
        </ul>
      </div>
    </div>
  );
}
