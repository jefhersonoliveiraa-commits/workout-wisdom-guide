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
  // Hierarchy: 1 primary stat (text-stat) + 2 secondary stats (text-base)
  const primaryStat = day.isRest
    ? { val: day.estimatedTime, label: day.dayIndex === 5 ? "min cardio" : "descanso", Icon: Clock }
    : { val: String(day.totalExercises), label: "exercícios", Icon: Zap };

  const secondaryStats = day.isRest
    ? [
        { val: day.dayIndex === 5 ? "leve" : "0", label: day.dayIndex === 5 ? "intensidade" : "treino", Icon: Layers },
        { val: day.dayIndex === 5 ? "0" : "✓", label: day.dayIndex === 5 ? "musculação" : "nutrição", Icon: Clock },
      ]
    : [
        { val: String(day.totalSets), label: "séries", Icon: Layers },
        { val: day.estimatedTime, label: "min", Icon: Clock },
      ];

  return (
    <div
      className="relative border border-border border-l-4 border-l-primary rounded-xl p-4 mb-4 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, hsl(270 80% 8%) 0%, hsl(240 10% 8%) 60%, hsl(174 20% 6%) 100%)",
      }}
    >
      {/* Decorative glows */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 w-[180px] h-[180px] rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 w-[120px] h-[120px] rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--lime) / 0.12), transparent 70%)" }}
      />

      <div className="relative">
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
              className="text-[11px] px-[10px] py-[3px] rounded-full text-foreground/90"
              style={{
                background: "hsl(var(--primary) / 0.18)",
                border: "1px solid hsl(var(--primary) / 0.35)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
          {/* Primary stat */}
          <div className="bg-bg4/60 backdrop-blur-sm rounded-xl p-[12px]">
            <div className="flex items-center gap-1 mb-[4px]">
              <primaryStat.Icon size={12} className="text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{primaryStat.label}</span>
            </div>
            <div className="text-stat text-primary font-mono">{primaryStat.val}</div>
          </div>
          {/* Secondary stats */}
          {secondaryStats.map((s, i) => (
            <div key={i} className="bg-bg4/60 backdrop-blur-sm rounded-xl p-[10px] text-center">
              <div className="flex justify-center mb-[4px]">
                <s.Icon size={11} className="text-muted-foreground/50" />
              </div>
              <div className="text-[16px] font-semibold text-foreground font-mono leading-none">{s.val}</div>
              <div className="text-[10px] text-muted-foreground mt-[4px]">{s.label}</div>
            </div>
          ))}
        </div>
        {!day.isRest && (
          <div className="mt-[12px]">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-bg4 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${progress < 100 ? "animate-progress-pulse" : ""}`}
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--lime)))",
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0 w-[30px] text-right">
                {progress}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
