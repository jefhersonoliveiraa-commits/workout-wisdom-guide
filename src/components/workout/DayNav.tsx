interface DayInfo {
  dayIndex: number;
  shortLabel: string;
  title: string;
  isRest: boolean;
}

interface DayNavProps {
  currentDay: number;
  onDayChange: (day: number) => void;
  days: DayInfo[];
}

export function DayNav({ currentDay, onDayChange, days }: DayNavProps) {
  return (
    <div className="flex-shrink-0 flex gap-[6px] px-[14px] py-[10px] overflow-x-auto scrollbar-none bg-background border-b border-border">
      {days.map((day) => (
        <button
          key={day.dayIndex}
          onClick={() => onDayChange(day.dayIndex)}
          className={`flex-shrink-0 rounded-[10px] px-[14px] py-[8px] text-[12px] font-medium text-center min-w-[70px] transition-all duration-150 border ${
            currentDay === day.dayIndex
              ? "bg-primary text-primary-foreground border-primary"
              : day.isRest
              ? "bg-bg3 border-border-bright border-dashed text-muted-foreground"
              : "bg-bg3 border-border text-muted-foreground"
          }`}
        >
          {day.shortLabel}
          <span className={`block text-[10px] mt-[2px] font-normal ${
            currentDay === day.dayIndex ? "text-primary-foreground/50" : "text-muted-foreground"
          }`}>
            {day.isRest ? "Descanso" : day.title}
          </span>
        </button>
      ))}
    </div>
  );
}
