import { type TrainingDay } from "@/data/workoutData";

interface HeroCardProps {
  day: TrainingDay;
  progress: number;
}

const colorMap: Record<string, string> = {
  primary: "bg-primary",
  blue: "bg-workout-blue",
  orange: "bg-workout-orange",
  teal: "bg-workout-teal",
  pink: "bg-workout-pink",
  yellow: "bg-workout-yellow",
};

export function HeroCard({ day, progress }: HeroCardProps) {
  const stats = day.isRest
    ? [
        { val: day.estimatedTime, label: day.dayIndex === 5 ? "min cardio" : "treino" },
        { val: day.dayIndex === 5 ? "leve" : "0", label: day.dayIndex === 5 ? "intensidade" : "treino" },
        { val: day.dayIndex === 5 ? "0" : "✓", label: day.dayIndex === 5 ? "musculação" : "nutrição" },
      ]
    : [
        { val: String(day.totalExercises), label: "exercícios" },
        { val: String(day.totalSets), label: "séries totais" },
        { val: day.estimatedTime, label: "min estimado" },
      ];

  return (
    <div className="bg-bg3 border border-border rounded-lg p-4 mb-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${colorMap[day.colorClass]}`} />
      <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">{day.dayLabel}</div>
      <div className="text-[22px] font-semibold text-foreground mb-[6px]">{day.title}</div>
      <div className="flex flex-wrap gap-[6px] mb-3">
        {day.tags.map((tag) => (
          <span key={tag} className="text-[11px] px-[10px] py-[3px] rounded-[20px] border border-border-bright text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="bg-bg4 rounded-sm p-[10px] text-center">
            <div className="text-[16px] font-semibold text-primary font-mono">{s.val}</div>
            <div className="text-[10px] text-muted-foreground mt-[2px]">{s.label}</div>
          </div>
        ))}
      </div>
      {!day.isRest && (
        <div className="bg-bg4 rounded-[4px] h-1 mt-[10px] overflow-hidden">
          <div
            className="h-full bg-primary rounded-[4px] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
