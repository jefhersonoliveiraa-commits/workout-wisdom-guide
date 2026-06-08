import { Check } from "lucide-react";

interface DayInfo {
  dayIndex: number;
  shortLabel: string;
  title: string;
  isRest: boolean;
  isToday?: boolean;
  isCompleted?: boolean;
}

interface DayNavProps {
  currentDay: number;
  onDayChange: (day: number) => void;
  days: DayInfo[];
}

export function DayNav({ currentDay, onDayChange, days }: DayNavProps) {
  return (
    <div className="flex-shrink-0 flex gap-[6px] px-[14px] py-[10px] overflow-x-auto scrollbar-none bg-background border-b border-border">
      {days.map((day) => {
        const isActive = currentDay === day.dayIndex;
        return (
          <button
            key={day.dayIndex}
            onClick={() => onDayChange(day.dayIndex)}
            className={`relative flex-shrink-0 rounded-[10px] px-[14px] py-[8px] min-h-[44px] text-[12px] font-medium text-center min-w-[70px] transition-all duration-150 border ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : day.isRest
                ? "bg-bg3 border-border-bright border-dashed text-muted-foreground"
                : "bg-bg3 border-border text-muted-foreground"
            } ${day.isToday && !isActive ? "ring-1 ring-lime/60" : ""}`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>{day.shortLabel}</span>
              {day.isCompleted && (
                <Check
                  size={10}
                  strokeWidth={3}
                  className={isActive ? "text-primary-foreground" : "text-lime"}
                />
              )}
            </div>
            <span
              className={`block text-[10px] mt-[2px] font-normal ${
                isActive ? "text-primary-foreground/60" : "text-muted-foreground"
              }`}
            >
              {day.isRest ? "Descanso" : day.title}
            </span>
            {day.isToday && !isActive && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-lime shadow-[0_0_6px_hsl(var(--lime))]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
