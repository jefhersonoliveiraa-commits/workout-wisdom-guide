import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, RotateCcw, Layers, Pause, Target, ArrowUpDown, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TechniqueCardProps {
  icon: React.ReactNode;
  name: string;
  tag: string;
  tagColor: string;
  summary: string;
  howTo: string;
  whenTo: string;
  warning?: string;
}

function TechniqueCard({ icon, name, tag, tagColor, summary, howTo, whenTo, warning }: TechniqueCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-bg2 border border-border rounded-xl overflow-hidden mb-2">
      <button
        className="w-full text-left p-4 flex items-center gap-3"
        onClick={() => setOpen(v => !v)}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-foreground">{name}</div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
        </div>
        <div className="text-muted-foreground flex-shrink-0">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <p className="text-[13px] text-muted-foreground leading-relaxed">{summary}</p>

          <div className="bg-bg3 rounded-xl p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">Como fazer</div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{howTo}</p>
          </div>

          <div className="bg-bg3 rounded-xl p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Quando usar</div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{whenTo}</p>
          </div>

          {warning && (
            <div className="flex gap-2 bg-workout-red/[0.08] border border-workout-red/25 rounded-xl p-3">
              <AlertTriangle size={14} className="text-workout-red flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-workout-red/90 leading-relaxed">{warning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const techniques: TechniqueCardProps[] = [
  {
    icon: <Zap size={16} />,
    name: "Drop Set",
    tag: "Intensidade alta",
    tagColor: "bg-red-500/15 text-red-400",
    summary: "Ao falhar numa carga, reduza imediatamente o peso (20–30%) e continue sem descanso. Mantém o músculo sob tensão além do ponto de falha mecânica.",
    howTo: "Faça sua série normal até falhar ou chegar ao RIR alvo. Sem descanso, reduza o peso e complete mais reps. Pode encadear 2–3 drops. Ex: 60kg → 45kg → 30kg.",
    whenTo: "Última série do exercício. Ideal em isolados (rosca, extensão, elevação lateral). Evite em compostos pesados (agachamento, terra).",
    warning: "Não use em todas as séries. Uma drop set por exercício é suficiente — mais que isso gera fadiga excessiva sem benefício extra.",
  },
  {
    icon: <RotateCcw size={16} />,
    name: "Rest-Pause",
    tag: "Volume eficiente",
    tagColor: "bg-orange-500/15 text-orange-400",
    summary: "Execute reps até próximo da falha, descanse 10–15 segundos e continue. Permite acumular mais reps de alta qualidade com uma única carga.",
    howTo: "Faça 6–8 reps (RIR 1). Descanse 10–15s respirando fundo. Faça mais 3–4 reps. Descanse novamente. Mais 2–3 reps. Total: ~15 reps onde faria 8.",
    whenTo: "Último set de isolados ou máquinas. Ótimo quando o tempo é curto e você quer maximizar o estímulo sem trocar de peso.",
    warning: "Use apenas na última série. O acúmulo de fadiga é alto — aplicar em múltiplas séries compromete a recuperação.",
  },
  {
    icon: <Layers size={16} />,
    name: "Myo-Rep",
    tag: "Maximizar volume",
    tagColor: "bg-yellow-500/15 text-yellow-400",
    summary: "Variação do rest-pause com foco em acumular muitas reps perto da falha. Um 'set de ativação' seguido de vários mini-sets curtos.",
    howTo: "Set de ativação: 12–15 reps (RIR 1–2). Descanse 3–5 respirações. Faça 3–5 reps. Repita os mini-sets 4–6 vezes mantendo a mesma carga. Pare quando não conseguir completar as reps do mini-set.",
    whenTo: "Exercícios isolados de baixo risco (rosca, leg extension, cable fly). Excelente quando quer mais volume sem adicionar séries ao treino.",
    warning: "Não recomendado para iniciantes ou exercícios com alta carga axial (agachamento, terra, barra). Exige boa percepção do RIR.",
  },
  {
    icon: <Pause size={16} />,
    name: "Pausa no Alongamento",
    tag: "Hipertrofia",
    tagColor: "bg-primary/15 text-primary",
    summary: "Adiciona uma pausa de 2–3 segundos no ponto de máximo alongamento do músculo. Aumenta o tempo sob tensão na posição de maior estímulo hipertrófico.",
    howTo: "No ponto de máximo alongamento (ex: rosca na baixa, fly aberto, agachamento fundo), segure por 2–3 segundos antes de subir. Mantenha o controle — não relaxe completamente.",
    whenTo: "Qualquer exercício onde o músculo fica alongado: rosca direta (baixo), pec deck/fly (aberto), RDL (quadril dobrado), pull-over. Funciona em qualquer série.",
    warning: "Reduza o peso em ~15–20% para manter a técnica. Não force o alongamento além da amplitude natural — risco de lesão em ombro e quadril.",
  },
  {
    icon: <Target size={16} />,
    name: "Cluster Set",
    tag: "Força + volume",
    tagColor: "bg-blue-500/15 text-blue-400",
    summary: "Divide uma série grande em mini-séries com pequenas pausas, permitindo usar cargas maiores e manter a qualidade de execução em todas as reps.",
    howTo: "Em vez de 1×10, faça (3+3+4) com 15–20s de descanso entre os grupos. Ou (5+5) com 20s. A carga pode ser 5–10% maior que o normal.",
    whenTo: "Compostos pesados quando o objetivo é força (supino, agachamento, terra). Ideal para fases de força onde quer acumular volume de qualidade com cargas altas.",
  },
  {
    icon: <ArrowUpDown size={16} />,
    name: "Superset",
    tag: "Eficiência",
    tagColor: "bg-teal-500/15 text-teal-400",
    summary: "Dois exercícios consecutivos sem descanso entre eles. Pode ser de músculos antagonistas (bíceps + tríceps) ou do mesmo músculo (agonista).",
    howTo: "Faça a série do exercício A, vá imediatamente para o exercício B. Descanse apenas após completar os dois. Antagonistas: bíceps curl → tríceps pushdown. Agonistas: supino → fly.",
    whenTo: "Quando o treino está longo e você quer reduzir o tempo total. Antagonistas são os mais seguros — recuperação de um não prejudica o outro.",
    warning: "Supersets agonistas (mesmo músculo) reduzem a carga que você consegue usar. Não combine exercícios que sobrecarregam a mesma articulação.",
  },
];

export function ProgressionPage() {
  return (
    <div className="pb-2">
      {/* Progressão de cargas */}
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
        Progressão de cargas
      </div>

      <div className="bg-bg2 border border-border border-l-4 border-l-primary rounded-xl p-4 mb-3">
        <div className="text-[13px] font-semibold text-foreground mb-1">Dupla Progressão</div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Primeiro aumente as <strong className="text-foreground">repetições</strong> dentro da faixa prescrita. Quando bater o topo da faixa em TODAS as séries com boa técnica, aumente a carga em <strong className="text-foreground">~2–5%</strong> na próxima sessão e volte ao piso da faixa.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-bg2 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Isolados pequenos</div>
          <div className="text-[18px] font-bold font-mono text-primary">+1–2,5kg</div>
          <div className="text-[10px] text-muted-foreground">lateral, rosca, panturrilha</div>
        </div>
        <div className="bg-bg2 border border-border rounded-xl p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Compostos grandes</div>
          <div className="text-[18px] font-bold font-mono text-primary">+2,5–5kg</div>
          <div className="text-[10px] text-muted-foreground">supino, agacho, RDL</div>
        </div>
      </div>

      {/* Conceitos-chave */}
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
        Conceitos-chave
      </div>

      <div className="space-y-2 mb-4">
        <div className="bg-bg2 border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className="text-primary" />
            <span className="text-[12px] font-semibold text-foreground">RIR — Reps In Reserve</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Quantas reps você ainda <em>poderia</em> fazer ao parar. RIR 0 = falha real. RIR 2 = poderia fazer mais 2. Compostos pesados: RIR 1–3. Isolados: RIR 0–1.
          </p>
        </div>

        <div className="bg-bg2 border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw size={13} className="text-primary" />
            <span className="text-[12px] font-semibold text-foreground">Deload</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            A cada 5–8 semanas, faça uma semana de deload: corte 40–50% do volume, mantenha as cargas. Permite recuperação estrutural sem perder força.
          </p>
        </div>

        <div className="bg-bg2 border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={13} className="text-yellow-400" />
            <span className="text-[12px] font-semibold text-foreground">Estagnação por 2+ semanas?</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Investigate sono, alimentação e estresse antes de forçar mais carga. Estagnação é sinal de recuperação insuficiente, não de preguiça.
          </p>
        </div>
      </div>

      {/* Técnicas avançadas */}
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-1">
        Técnicas avançadas
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Use apenas na última série dos exercícios marcados. Toque para ver como executar.
      </p>

      {techniques.map(t => (
        <TechniqueCard key={t.name} {...t} />
      ))}

      {/* Sinais de progresso */}
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3 mt-4">
        Sinais de que você está progredindo
      </div>
      <div className="bg-bg2 border border-border rounded-xl p-4 space-y-2">
        {[
          "Consegue mais repetições com a mesma carga",
          "Aumentou a carga com o mesmo número de repetições",
          "O esforço percebido (RPE) diminuiu para a mesma carga",
          "Melhora da disposição e recuperação entre os treinos",
          "Roupas ficando menos apertadas (recomposição)",
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-primary flex-shrink-0 mt-0.5" />
            <span className="text-[12px] text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
