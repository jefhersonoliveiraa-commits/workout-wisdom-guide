import { Zap, Layers, Clock } from "lucide-react";

interface HeroDay {
  dayIndex: number;
  dayLabel?: string;
  title: string;
  colorClass: string;
  tags: string[];
  isRest: boolean;
  totalExercises: number;
  totalSets: number;
  estimatedTime: string;
}

interface HeroCardProps {
  day: HeroDay;
  progress: number;
}

export function HeroCard({ day, progress }: HeroCardProps) {
  const statIcons = [Zap, Layers, Clock];

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
    <div className="bg-bg3 border border-border border-l-4 border-l-primary rounded-xl p-4 mb-4 overflow-hidden">
      {day.dayLabel && (
        <div className="text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">
          {day.dayLabel}
        </div>
      )}
      <div className="text-[20px] font-bold text-foreground mb-[8px]">{day.title}</div>
      <div className="flex flex-wrap gap-[6px] mb-3">
        {day.tags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] px-[10px] py-[3px] rounded-full bg-bg4 text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s, i) => {
          const StatIcon = statIcons[i];
          return (
            <div key={i} className="bg-bg4 rounded-xl p-[10px] text-center">
              <div className="flex justify-center mb-[4px]">
                <StatIcon size={12} className="text-muted-foreground/50" />
              </div>
              <div className="text-[22px] font-bold text-primary font-mono leading-none">{s.val}</div>
              <div className="text-[10px] text-muted-foreground mt-[4px]">{s.label}</div>
            </div>
          );
        })}
      </div>
      {!day.isRest && (
        <div className="mt-[12px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg4 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0 w-[30px] text-right">
              {progress}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
