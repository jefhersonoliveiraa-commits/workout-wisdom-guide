import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { loadBodyWeightHistory, getLatestBodyWeight, getWeightChange } from "@/lib/bodyWeight";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Profile } from "@/lib/supabase";

interface ProfilePageProps {
  studentId: string;
  profile: Profile;
  onOpenWeighIn: () => void;
}

export function ProfilePage({ studentId, profile, onOpenWeighIn }: ProfilePageProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.full_name);
  const [editHeight, setEditHeight] = useState(profile.height_m ? String(profile.height_m) : "");
  const [saving, setSaving] = useState(false);

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

  const handleSaveProfile = async () => {
    const name = editName.trim();
    const h = editHeight ? parseFloat(editHeight.replace(",", ".")) : null;
    if (!name || name.length < 2) { toast.error("Nome deve ter ao menos 2 caracteres"); return; }
    if (h !== null && (h < 1.0 || h > 2.5)) { toast.error("Altura inválida (entre 1.0 e 2.5 m)"); return; }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, height_m: h })
      .eq('id', studentId);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    // Invalida o cache do perfil no AuthContext recarregando a página é o caminho mais simples
    toast.success("Perfil atualizado!");
    setEditing(false);
    // Força reload para o AuthContext buscar o novo perfil
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Seu perfil
      </div>

      {/* Card de perfil */}
      <div className="bg-bg2 border border-border rounded-lg p-4 mb-4">
        {!editing ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-[20px] font-semibold text-primary flex-shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-foreground">{profile.full_name}</div>
              <div className="text-[12px] text-muted-foreground">
                {profile.role === 'student' ? 'Aluno' : 'Treinador'}
                {profile.height_m ? ` · ${profile.height_m}m` : ''}
              </div>
            </div>
            <button
              onClick={() => { setEditName(profile.full_name); setEditHeight(profile.height_m ? String(profile.height_m) : ""); setEditing(true); }}
              className="text-[11px] text-muted-foreground hover:text-primary border border-border hover:border-primary rounded-[6px] px-3 py-1.5 transition-colors flex-shrink-0"
            >
              Editar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-foreground mb-2">Editar perfil</div>
            <div className="space-y-1">
              <Label className="text-[11px]">Nome completo</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Altura (m) — usada para calcular IMC</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 1.75"
                value={editHeight}
                onChange={e => setEditHeight(e.target.value)}
                className="text-[13px]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ID do usuário — para compartilhar com o treinador */}
      <div className="bg-bg2 border border-border rounded-lg p-3 mb-4">
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1">
          Seu ID de usuário
        </div>
        <div className="text-[11px] font-mono text-muted-foreground break-all leading-relaxed">
          {studentId}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(studentId); toast.success("ID copiado!"); }}
          className="mt-2 text-[11px] text-primary hover:underline"
        >
          Copiar ID
        </button>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Compartilhe este ID com seu treinador para que ele vincule sua conta.
        </p>
      </div>

      {/* Métricas */}
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

      {/* Evolução do peso */}
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
