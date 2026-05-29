import { useQuery } from "@tanstack/react-query";
import { loadBodyWeightHistory, getLatestBodyWeight, getWeightChange } from "@/lib/bodyWeight";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Profile } from "@/lib/supabase";

interface ProfilePageProps {
  studentId: string;
  profile: Profile;
  onOpenWeighIn: () => void;
}

export function ProfilePage({ studentId, profile, onOpenWeighIn }: ProfilePageProps) {
  const { data: latest } = useQuery({
    queryKey: ['latest-body-weight', studentId],
    queryFn: () => getLatestBodyWeight(studentId),
  });

  const { data: weightChange } = useQuery({
    queryKey: ['weight-change', studentId],
    queryFn: () => getWeightChange(studentId),
  });

  const { data: bodyWeightHistory = [] } = useQuery({
    queryKey: ['body-weight-history', studentId],
    queryFn: () => loadBodyWeightHistory(studentId),
  });

  const chartData = bodyWeightHistory.map(entry => ({
    date: new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
    peso: entry.weight,
    imc: entry.bmi,
  }));

  const displayWeight = latest?.weight ? `${latest.weight}kg` : "—";
  const displayBmi = latest?.bmi ? String(latest.bmi) : "—";
  const displayHeight = profile.height_m ? `${profile.height_m}m` : "—";

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Seu perfil
      </div>

      <div className="bg-bg2 border border-border rounded-lg p-4 mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-[20px] font-semibold text-primary">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-[15px] font-semibold text-foreground">{profile.full_name}</div>
          <div className="text-[12px] text-muted-foreground capitalize">{profile.role === 'student' ? 'Aluno' : 'Treinador'}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { val: displayWeight, label: "peso atual" },
          { val: displayHeight, label: "altura" },
          { val: displayBmi, label: "IMC" },
        ].map((m) => (
          <div key={m.label} className="bg-bg2 border border-border rounded-lg p-3 text-center">
            <div className="text-[20px] font-semibold font-mono text-primary">{m.val}</div>
            <div className="text-[10px] text-muted-foreground mt-[3px]">{m.label}</div>
          </div>
        ))}
      </div>

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
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }} axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(0 0% 40%)" }} axisLine={{ stroke: "hsl(0 0% 100% / 0.08)" }} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} unit="kg" />
              <Tooltip contentStyle={{ background: "hsl(0 0% 11.8%)", border: "1px solid hsl(0 0% 100% / 0.14)", borderRadius: "8px", fontSize: "12px", color: "hsl(0 0% 94.1%)" }} formatter={(value: number) => [`${value}kg`, "Peso"]} />
              <Line type="monotone" dataKey="peso" stroke="hsl(79 88% 62%)" strokeWidth={2} dot={{ fill: "hsl(79 88% 62%)", r: 3 }} activeDot={{ r: 5 }} />
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

      <div className="bg-bg2 border border-workout-red/30 rounded-lg p-4">
        <h3 className="text-[14px] font-medium text-workout-red mb-2">Esta ficha não substitui avaliação médica</h3>
        <p className="text-[13px] text-muted-foreground leading-[1.7]">
          Este plano foi elaborado com base em evidências científicas e no seu perfil. Consulte um médico ou fisioterapeuta antes de iniciar ou progredir as cargas caso tenha restrições.
        </p>
      </div>
    </div>
  );
}
