import { profileData, trainingDays } from "@/data/workoutData";

export function ProfilePage() {
  const metrics = [
    { val: String(profileData.age), label: "anos" },
    { val: profileData.weight, label: "peso atual" },
    { val: profileData.height, label: "altura" },
    { val: profileData.bmi, label: "IMC" },
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
