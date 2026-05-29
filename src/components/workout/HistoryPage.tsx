import { useQuery } from "@tanstack/react-query";
import { loadHistory, getWeekHistory } from "@/lib/storage";

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface HistoryPageProps {
  studentId: string;
}

export function HistoryPage({ studentId }: HistoryPageProps) {
  const { data: weekSessions = [] } = useQuery({
    queryKey: ['week-history', studentId],
    queryFn: () => getWeekHistory(studentId),
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['all-history', studentId],
    queryFn: () => loadHistory(studentId),
  });

  const sortedSessions = [...allSessions].sort((a, b) => b.date.localeCompare(a.date));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const session = weekSessions.find(s => s.dayIndex === i);
    return { dayIndex: i, label: DAY_LABELS[i], session };
  });

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Esta semana
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map(({ dayIndex, label, session }) => {
          const completed = session && session.exercisesCompleted === session.totalExercises;
          const partial = session && session.exercisesCompleted > 0 && !completed;

          return (
            <div
              key={dayIndex}
              className={`bg-bg2 border rounded-sm p-2 text-center ${
                completed ? "border-primary bg-primary/10" : partial ? "border-workout-yellow/40" : "border-border"
              }`}
            >
              <div className="text-[9px] text-muted-foreground uppercase">{label}</div>
              <div className={`text-[16px] mt-1 ${
                completed ? "text-primary" : partial ? "text-workout-yellow" : "text-muted-foreground/30"
              }`}>
                {completed ? "✓" : partial ? "◐" : "○"}
              </div>
              <div className="text-[8px] text-muted-foreground mt-1">
                {session ? `${session.exercisesCompleted}/${session.totalExercises}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Estatísticas
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
          <div className="text-[20px] font-semibold font-mono text-primary">
            {weekSessions.filter(s => s.exercisesCompleted > 0).length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">treinos semana</div>
        </div>
        <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
          <div className="text-[20px] font-semibold font-mono text-primary">
            {weekSessions.reduce((a, s) => a + s.exercisesCompleted, 0)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">exercícios</div>
        </div>
        <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
          <div className="text-[20px] font-semibold font-mono text-primary">
            {allSessions.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">total sessões</div>
        </div>
      </div>

      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
        Histórico recente
      </div>

      {sortedSessions.length === 0 && (
        <div className="bg-bg2 border border-border rounded-lg p-6 text-center">
          <div className="text-[28px] mb-2">📋</div>
          <p className="text-[13px] text-muted-foreground">Nenhum treino registrado ainda. Complete exercícios para ver seu histórico aqui!</p>
        </div>
      )}

      {sortedSessions.slice(0, 20).map((session, i) => {
        const pct = session.totalExercises > 0
          ? Math.round((session.exercisesCompleted / session.totalExercises) * 100)
          : 0;
        const dateStr = new Date(session.date + "T12:00:00").toLocaleDateString("pt-BR", {
          weekday: "short", day: "numeric", month: "short",
        });

        return (
          <div key={i} className="bg-bg2 border border-border rounded-lg p-3 mb-2 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-mono font-semibold ${
              pct === 100 ? "bg-primary/20 text-primary" : "bg-bg4 text-muted-foreground"
            }`}>
              {pct}%
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground">{session.dayTitle}</div>
              <div className="text-[11px] text-muted-foreground">{dateStr} · {session.exercisesCompleted}/{session.totalExercises} exercícios</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
