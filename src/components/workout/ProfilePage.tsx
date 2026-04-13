import { useMemo } from "react";
import { profileData, trainingDays } from "@/data/workoutData";
import { loadBodyWeightHistory, getLatestBodyWeight, getWeightChange } from "@/lib/bodyWeight";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

interface ProfilePageProps {
  onOpenWeighIn: () => void;
}

export function ProfilePage({ onOpenWeighIn }: ProfilePageProps) {
  const latest = getLatestBodyWeight();
  const weightChange = getWeightChange();
  const bodyWeightHistory = useMemo(() => loadBodyWeightHistory(), []);

  const chartData = bodyWeightHistory.map(entry => ({
    date: new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
    peso: entry.weight,
    imc: entry.bmi,
  }));

  const displayWeight = latest?.weight ? `${latest.weight}kg` : profileData.weight;
  const displayBmi = latest?.bmi ? String(latest.bmi) : profileData.bmi;

  const metrics = [
    { val: String(profileData.age), label: "anos" },
    { val: displayWeight, label: "peso atual" },
    { val: profileData.height, label: "altura" },
    { val: displayBmi, label: "IMC" },
  ];

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Seu perfil
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-bg2 border border-border rounded-lg p-3 text-center">
            <div className="text-[20px] font-semibold font-mono text-primary">{m.val}</div>
            <div className="text-[10px] text-muted-foreground mt-[3px]">{m.label}</div>
          </div>
        ))}
        <div className="bg-bg2 border border-border rounded-lg p-3 text-center col-span-2">
          <div className="text-[14px] font-semibold font-mono text-primary">{profileData.goal}</div>
          <div className="text-[10px] text-muted-foreground mt-[3px]">objetivo</div>
        </div>
      </div>

      {/* Body weight tracking section */}
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Evolução do peso corporal
      </div>

      <div className="bg-bg2 border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-medium text-foreground">
              {latest ? `${latest.weight}kg` : "Sem registro"}
            </div>
            {weightChange && (
              <div className={`text-[11px] font-mono mt-[2px] ${
                weightChange.change < 0 ? "text-primary" : weightChange.change > 0 ? "text-workout-orange" : "text-muted-foreground"
              }`}>
                {weightChange.change > 0 ? "+" : ""}{weightChange.change}kg {weightChange.period}
              </div>
            )}
          </div>
          <button
            onClick={onOpenWeighIn}
            className="text-[11px] bg-primary/20 text-primary border border-primary/30 rounded-[6px] px-3 py-[6px] font-medium transition-colors hover:bg-primary/30"
          >
            ⚖️ Registrar peso
          </button>
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }}
                axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }}
                axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }}
                tickLine={false}
                domain={["dataMin - 2", "dataMax + 2"]}
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
                formatter={(value: number) => [`${value}kg`, "Peso"]}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="hsl(79 88% 62%)"
                strokeWidth={2}
                dot={{ fill: "hsl(79 88% 62%)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : chartData.length === 1 ? (
          <div className="text-[12px] text-muted-foreground text-center py-4">
            Registre mais um peso para ver o gráfico de evolução 📊
          </div>
        ) : (
          <div className="text-[12px] text-muted-foreground text-center py-4">
            Nenhum registro ainda. Clique em "Registrar peso" acima ☝️
          </div>
        )}
      </div>

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Divisão da semana
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {trainingDays.map((day) => (
          <div
            key={day.dayIndex}
            className={`bg-bg2 border rounded-sm p-2 text-center ${
              !day.isRest ? "border-primary" : "border-border"
            }`}
          >
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.06em]">{day.shortLabel}</div>
            <div className={`w-[6px] h-[6px] rounded-full mx-auto my-1 ${
              !day.isRest ? "bg-primary" : day.dayIndex === 5 ? "bg-workout-yellow/50" : "bg-border-bright"
            }`} />
            <div className="text-[8px] text-muted-foreground leading-tight">
              {day.isRest ? (day.dayIndex === 5 ? "Ativo" : "Desc.") : day.title.split(" ").pop()}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Alertas do seu perfil
      </div>
      {profileData.warnings.map((w, i) => (
        <div key={i} className="bg-workout-yellow/[0.07] border border-workout-yellow/25 rounded-lg p-4 mb-4">
          <div className="text-[12px] font-semibold text-workout-yellow mb-[6px] uppercase tracking-wider">{w.title}</div>
          <p className="text-[13px] text-workout-yellow/80 leading-[1.7]">{w.text}</p>
        </div>
      ))}

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Aviso médico obrigatório
      </div>
      <div className="bg-workout-red/[0.05] border border-workout-red/30 rounded-lg p-4">
        <h3 className="text-[14px] font-medium text-workout-red mb-2">Esta ficha não substitui avaliação médica</h3>
        <p className="text-[13px] text-muted-foreground leading-[1.7]">
          Este plano foi elaborado com base em evidências científicas e no perfil informado, mas não substitui avaliação médica ou fisioterapêutica presencial. Em razão das dores no ombro esquerdo e na lombar, consulte um médico ortopedista ou fisioterapeuta antes de iniciar ou progredir as cargas.
        </p>
      </div>
    </div>
  );
}
