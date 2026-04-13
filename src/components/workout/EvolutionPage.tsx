import { useMemo, useState } from "react";
import { getWeightHistory } from "@/lib/storage";
import { trainingDays } from "@/data/workoutData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function EvolutionPage() {
  const allExercises = useMemo(() => {
    return trainingDays
      .filter(d => !d.isRest)
      .flatMap(d => d.exercises.map(e => ({ ...e, dayTitle: d.title })));
  }, []);

  const [selectedExercise, setSelectedExercise] = useState(allExercises[0]?.id || "");

  const chartData = useMemo(() => {
    const history = getWeightHistory(selectedExercise);
    return history.map(entry => ({
      date: new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      peso: entry.weight,
    }));
  }, [selectedExercise]);

  const exerciseName = allExercises.find(e => e.id === selectedExercise)?.name || "";

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Evolução de cargas
      </div>

      <div className="bg-bg2 border border-border rounded-lg p-3 mb-4">
        <label className="text-[11px] text-muted-foreground block mb-2">Selecione o exercício:</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full bg-bg3 border border-border rounded-sm p-2 text-[13px] text-foreground outline-none focus:border-primary transition-colors"
        >
          {trainingDays.filter(d => !d.isRest).map(day => (
            <optgroup key={day.dayIndex} label={`${day.shortLabel} — ${day.title}`}>
              {day.exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {chartData.length > 0 ? (
        <div className="bg-bg2 border border-border rounded-lg p-4 mb-4">
          <h3 className="text-[13px] font-medium text-foreground mb-1">{exerciseName}</h3>
          <p className="text-[11px] text-muted-foreground mb-4">{chartData.length} registros</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(0 0% 40%)" }}
                axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(0 0% 40%)" }}
                axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }}
                tickLine={false}
                unit="kg"
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(0 0% 11.8%)",
                  border: "1px solid hsl(0 0% 100% / 0.14)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(0 0% 94.1%)",
                }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="hsl(79 88% 62%)"
                strokeWidth={2}
                dot={{ fill: "hsl(79 88% 62%)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-bg2 border border-border rounded-lg p-6 text-center mb-4">
          <div className="text-[28px] mb-2">📊</div>
          <p className="text-[13px] text-muted-foreground">
            Nenhum registro de carga para este exercício. Abra um exercício durante o treino e registre o peso utilizado!
          </p>
        </div>
      )}

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Como usar
      </div>
      <div className="bg-bg2 border border-border rounded-lg p-4">
        <ul className="list-disc pl-4 text-[13px] text-muted-foreground leading-[1.7] space-y-1">
          <li>Abra um exercício durante o treino</li>
          <li>Digite o peso utilizado no campo "Carga"</li>
          <li>Clique em "Salvar" para registrar</li>
          <li>Volte aqui para ver sua evolução ao longo do tempo</li>
        </ul>
      </div>
    </div>
  );
}
