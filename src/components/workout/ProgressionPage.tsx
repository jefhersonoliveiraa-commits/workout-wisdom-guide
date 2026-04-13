import { progressionSteps } from "@/data/workoutData";

export function ProgressionPage() {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Estratégia de progressão
      </div>

      <div className="bg-bg2 border border-border rounded-lg p-[14px] mb-[10px] border-l-[3px] border-l-primary rounded-l-none">
        <h3 className="text-[14px] font-medium text-foreground mb-2">Método: Dupla Progressão</h3>
        <p className="text-[13px] text-muted-foreground leading-[1.7]">
          Primeiro aumente as repetições dentro da faixa. Quando atingir o limite superior com boa técnica em TODAS as séries, aumente a carga em ~2–5% na próxima sessão.
        </p>
      </div>

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px] mt-5">
        Fases do programa
      </div>

      {progressionSteps.map((step) => (
        <div key={step.num} className="flex gap-3 items-start mb-[14px]">
          <div className="w-7 h-7 rounded-full bg-bg4 border border-border-bright flex items-center justify-center text-[12px] font-semibold text-primary flex-shrink-0 font-mono">
            {step.num}
          </div>
          <div className="text-[13px] text-muted-foreground leading-[1.7] pt-1">
            <strong className="text-foreground font-medium">{step.title}</strong>
            <br />
            {step.text}
          </div>
        </div>
      ))}

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px] mt-5">
        Sinais de que você está progredindo
      </div>
      <div className="bg-bg2 border border-border rounded-lg p-[14px]">
        <ul className="list-disc pl-4 text-[13px] text-muted-foreground leading-[1.7] space-y-1">
          <li>Consegue mais repetições com a mesma carga</li>
          <li>Aumentou a carga com o mesmo número de repetições</li>
          <li>O esforço percebido (RPE) diminuiu para a mesma carga</li>
          <li>Melhora da disposição e recuperação entre os treinos</li>
          <li>Roupas ficando menos apertadas (recomposição)</li>
        </ul>
      </div>
    </div>
  );
}
