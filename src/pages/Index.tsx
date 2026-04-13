import { useState, useCallback } from "react";
import { trainingDays } from "@/data/workoutData";
import { useWorkoutState } from "@/hooks/useWorkoutState";
import { useRestTimer } from "@/hooks/useRestTimer";
import { saveSession } from "@/lib/storage";
import { TopBar } from "@/components/workout/TopBar";
import { DayNav } from "@/components/workout/DayNav";
import { HeroCard } from "@/components/workout/HeroCard";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { BottomNav } from "@/components/workout/BottomNav";
import { RestTimerOverlay } from "@/components/workout/RestTimerOverlay";
import { ProgressionPage } from "@/components/workout/ProgressionPage";
import { ProfilePage } from "@/components/workout/ProfilePage";
import { HistoryPage } from "@/components/workout/HistoryPage";
import { EvolutionPage } from "@/components/workout/EvolutionPage";

const getTodayDayIndex = () => {
  const map: Record<number, number> = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  return map[new Date().getDay()];
};

const Index = () => {
  const [currentDay, setCurrentDay] = useState(getTodayDayIndex);
  const [currentPage, setCurrentPage] = useState("treino");
  const workout = useWorkoutState();
  const timer = useRestTimer();

  const day = trainingDays[currentDay];
  const progress = workout.getDayProgress(currentDay, day.exercises);

  // Auto-save session when exercises are completed
  const handleSetComplete = useCallback((restSeconds: number) => {
    timer.startTimer(restSeconds);
    // Save session progress
    const completedCount = day.exercises.filter(ex =>
      workout.isExerciseDone(ex.id, ex.sets)
    ).length;
    if (completedCount > 0) {
      saveSession({
        date: new Date().toISOString().split("T")[0],
        dayIndex: day.dayIndex,
        dayTitle: day.title,
        exercisesCompleted: completedCount,
        totalExercises: day.exercises.length,
        weights: {},
      });
    }
  }, [timer, day, workout]);

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />

      {currentPage === "treino" && (
        <DayNav currentDay={currentDay} onDayChange={setCurrentDay} />
      )}

      <div className="flex-1 overflow-y-auto px-[14px] py-4 pb-[calc(80px+env(safe-area-inset-bottom))] scrollbar-none">
        {currentPage === "treino" && (
          <>
            <HeroCard day={day} progress={progress} />

            {day.warning && (
              <div className="bg-workout-yellow/[0.07] border border-workout-yellow/25 rounded-lg p-4 mb-4">
                <div className="text-[12px] font-semibold text-workout-yellow mb-[6px] uppercase tracking-wider">
                  {day.warning.title}
                </div>
                <p className="text-[13px] text-workout-yellow/80 leading-[1.7]">{day.warning.text}</p>
              </div>
            )}

            {!day.isRest && day.exercises.length > 0 && (
              <>
                <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
                  Exercícios
                </div>

                {day.exercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    setsCompleted={workout.state.setsCompleted[ex.id] || []}
                    isOpen={!!workout.state.exercisesOpen[ex.id]}
                    onToggleOpen={() => workout.toggleExOpen(ex.id)}
                    onToggleSet={(idx) => workout.toggleSet(ex.id, idx, ex.sets)}
                    onToggleAll={() => workout.toggleAllSets(ex.id, ex.sets)}
                    onSetComplete={handleSetComplete}
                  />
                ))}

                {day.core.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px] mt-5">
                      Core — adicione ao final (10–15 min)
                    </div>
                    {day.core.map((c, i) => (
                      <div key={i} className="bg-bg3 border border-border rounded-sm p-3 mb-2 flex gap-3 items-start">
                        <span className="text-[20px] flex-shrink-0">{c.icon}</span>
                        <div>
                          <div className="text-[13px] font-medium text-foreground">{c.name}</div>
                          <div className="text-[12px] text-muted-foreground leading-[1.6] mt-[3px]">{c.description}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {day.isRest && day.restInfo?.map((info, i) => (
              <div key={i} className="bg-bg2 border border-border rounded-lg p-4 mb-[10px]">
                <h3 className="text-[14px] font-medium text-foreground mb-2">{info.title}</h3>
                {info.items.length === 1 ? (
                  <p className="text-[13px] text-muted-foreground leading-[1.7]">{info.items[0]}</p>
                ) : (
                  <ul className="list-disc pl-4 text-[13px] text-muted-foreground leading-[1.7] space-y-1">
                    {info.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {currentPage === "historico" && <HistoryPage />}
        {currentPage === "evolucao" && <EvolutionPage />}
        {currentPage === "prog" && <ProgressionPage />}
        {currentPage === "perfil" && <ProfilePage />}
      </div>

      <RestTimerOverlay
        isRunning={timer.isRunning}
        seconds={timer.seconds}
        totalSeconds={timer.totalSeconds}
        formatTime={timer.formatTime}
        onStop={timer.stopTimer}
      />

      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
};

export default Index;
