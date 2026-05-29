import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentPlan } from "@/hooks/useStudentPlan";
import { useWorkoutState } from "@/hooks/useWorkoutState";
import { useRestTimer } from "@/hooks/useRestTimer";
import { saveSession } from "@/lib/storage";
import { shouldPromptWeighIn, wasDismissedToday, dismissWeighInPrompt } from "@/lib/bodyWeight";
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
import { WeighInModal } from "@/components/workout/WeighInModal";
import type { DbTrainingDay } from "@/types/plan";

const getTodayDayIndex = () => {
  const map: Record<number, number> = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  return map[new Date().getDay()];
};

export default function StudentApp() {
  const { user, profile } = useAuth();
  const { data: plan, isLoading: planLoading } = useStudentPlan(user?.id);

  const [currentDay, setCurrentDay] = useState(getTodayDayIndex);
  const [currentPage, setCurrentPage] = useState("treino");
  const workout = useWorkoutState();
  const timer = useRestTimer();
  const [showWeighIn, setShowWeighIn] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    shouldPromptWeighIn(user.id).then(should => {
      if (should && !wasDismissedToday()) {
        const timeout = setTimeout(() => setShowWeighIn(true), 2000);
        return () => clearTimeout(timeout);
      }
    });
  }, [user?.id]);

  const trainingDays = plan?.training_days ?? [];
  const day: DbTrainingDay | undefined = trainingDays[currentDay];

  const exercises = day?.exercises ?? [];

  const progress = workout.getDayProgress(
    currentDay,
    exercises.map(e => ({ id: e.id, sets: e.sets }))
  );

  const handleSetComplete = useCallback(async (restSeconds: number) => {
    timer.startTimer(restSeconds);
    if (!user?.id || !day) return;
    const completedCount = exercises.filter(ex =>
      workout.isExerciseDone(ex.id, ex.sets)
    ).length;
    if (completedCount > 0) {
      await saveSession(
        {
          date: new Date().toISOString().split("T")[0],
          dayIndex: day.day_index,
          dayTitle: day.title,
          exercisesCompleted: completedCount,
          totalExercises: exercises.length,
          weights: {},
        },
        user.id,
        plan?.id
      );
    }
  }, [timer, day, exercises, workout, user?.id, plan?.id]);

  const handleDismissWeighIn = () => {
    dismissWeighInPrompt();
    setShowWeighIn(false);
  };

  if (planLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-[13px] text-muted-foreground">Carregando sua ficha...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-[48px]">🏋️</div>
          <h2 className="text-[18px] font-semibold text-foreground">Nenhuma ficha atribuída</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Aguarde seu treinador criar e atribuir uma ficha de treino para você.
          </p>
        </div>
      </div>
    );
  }

  // Adapt DbTrainingDay to the shape HeroCard and DayNav expect
  const adaptedDays = trainingDays.map(d => ({
    dayIndex: d.day_index,
    shortLabel: d.short_label,
    isRest: d.is_rest,
    title: d.title,
    colorClass: d.color_class as any,
    tags: d.tags ?? [],
    exercises: d.exercises,
    totalExercises: d.exercises.length,
    totalSets: d.exercises.reduce((s, e) => s + e.sets, 0),
    estimatedTime: d.estimated_time ?? "—",
  }));

  const adaptedDay = adaptedDays[currentDay];

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />

      {currentPage === "treino" && (
        <DayNav
          currentDay={currentDay}
          onDayChange={setCurrentDay}
          days={adaptedDays}
        />
      )}

      <div className="flex-1 overflow-y-auto px-[14px] py-4 pb-[calc(80px+env(safe-area-inset-bottom))] scrollbar-none">
        {currentPage === "treino" && adaptedDay && (
          <>
            <HeroCard day={adaptedDay as any} progress={progress} />

            {day?.warning_title && (
              <div className="bg-workout-yellow/[0.07] border border-workout-yellow/25 rounded-lg p-4 mb-4">
                <div className="text-[12px] font-semibold text-workout-yellow mb-[6px] uppercase tracking-wider">
                  {day.warning_title}
                </div>
                {day.warning_text && (
                  <p className="text-[13px] text-workout-yellow/80 leading-[1.7]">{day.warning_text}</p>
                )}
              </div>
            )}

            {!day?.is_rest && exercises.length > 0 && (
              <>
                <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-[10px]">
                  Exercícios
                </div>

                {exercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    studentId={user!.id}
                    planId={plan.id}
                    setsCompleted={workout.state.setsCompleted[ex.id] || []}
                    isOpen={!!workout.state.exercisesOpen[ex.id]}
                    onToggleOpen={() => workout.toggleExOpen(ex.id)}
                    onToggleSet={(idx) => workout.toggleSet(ex.id, idx, ex.sets)}
                    onToggleAll={() => workout.toggleAllSets(ex.id, ex.sets)}
                    onSetComplete={handleSetComplete}
                  />
                ))}
              </>
            )}

            {day?.is_rest && (
              <div className="bg-bg2 border border-border rounded-lg p-6 text-center">
                <div className="text-[32px] mb-3">😴</div>
                <h3 className="text-[16px] font-medium text-foreground mb-2">Dia de Descanso</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Aproveite para recuperar. Considere mobilidade leve ou caminhada se quiser se mover.
                </p>
              </div>
            )}
          </>
        )}

        {currentPage === "historico" && <HistoryPage studentId={user!.id} />}
        {currentPage === "evolucao" && <EvolutionPage studentId={user!.id} plan={plan} />}
        {currentPage === "prog" && <ProgressionPage />}
        {currentPage === "perfil" && (
          <ProfilePage
            studentId={user!.id}
            profile={profile!}
            onOpenWeighIn={() => setShowWeighIn(true)}
          />
        )}
      </div>

      <RestTimerOverlay
        isRunning={timer.isRunning}
        seconds={timer.seconds}
        totalSeconds={timer.totalSeconds}
        formatTime={timer.formatTime}
        onStop={timer.stopTimer}
      />

      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />

      <WeighInModal
        isOpen={showWeighIn}
        studentId={user!.id}
        heightM={profile?.height_m ?? null}
        onClose={() => setShowWeighIn(false)}
        onDismiss={handleDismissWeighIn}
      />
    </div>
  );
}
