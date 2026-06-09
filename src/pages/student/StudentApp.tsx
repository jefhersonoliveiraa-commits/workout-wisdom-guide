import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  const workout = useWorkoutState(user!.id);
  const timer = useRestTimer();
  const [showWeighIn, setShowWeighIn] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const todayDayIndex = getTodayDayIndex();

  useEffect(() => {
    if (!user?.id) return;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    shouldPromptWeighIn(user.id).then(should => {
      if (should && !wasDismissedToday(user.id)) {
        timeoutId = setTimeout(() => setShowWeighIn(true), 2000);
      }
    });
    return () => { if (timeoutId) clearTimeout(timeoutId); };
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
    dismissWeighInPrompt(user?.id);
    setShowWeighIn(false);
  };

  // Celebration — fire once per day when day reaches 100%
  useEffect(() => {
    if (progress !== 100 || !user?.id || !day || day.is_rest) return;
    const flagKey = `workout-celebrated:${user.id}:${day.day_index}:${new Date().toDateString()}`;
    if (localStorage.getItem(flagKey)) return;
    localStorage.setItem(flagKey, "1");
    setCelebrating(true);
    try { navigator.vibrate?.([100, 50, 100]); } catch {}
    const t = setTimeout(() => setCelebrating(false), 2800);
    return () => clearTimeout(t);
  }, [progress, user?.id, day]);

  // Memoize adapted days with today/completed flags
  const adaptedDays = useMemo(() => trainingDays.map(d => ({
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
    isToday: d.day_index === todayDayIndex,
    isCompleted: !d.is_rest && d.exercises.length > 0 &&
      workout.getDayProgress(d.day_index, d.exercises.map(e => ({ id: e.id, sets: e.sets }))) === 100,
  })), [trainingDays, todayDayIndex, workout]);

  if (planLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-[14px] py-4 pb-[calc(80px+env(safe-area-inset-bottom))] scrollbar-none">
          {/* Skeleton HeroCard */}
          <Skeleton className="h-[140px] w-full rounded-xl mb-4" />
          {/* Skeleton section label */}
          <Skeleton className="h-3 w-24 rounded-md mb-[10px]" />
          {/* Skeleton ExerciseCards */}
          <Skeleton className="h-[120px] w-full rounded-xl mb-3" />
          <Skeleton className="h-[100px] w-full rounded-xl mb-3" />
          <Skeleton className="h-[110px] w-full rounded-xl" />
        </div>
        <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TopBar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <ClipboardList size={48} className="text-primary/40" />
          <h2 className="text-[18px] font-semibold text-foreground">Nenhum plano atribuído ainda</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Aguarde seu professor adicionar um plano de treino para você.
          </p>
        </div>
      </div>
    );
  }

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
        {currentPage === "evolucao" && <EvolutionPage studentId={user!.id} plan={plan} onOpenWeighIn={() => setShowWeighIn(true)} />}
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

      {/* Celebration overlay — fires once per day on 100% */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            className="fixed inset-0 z-[60] pointer-events-none flex items-start justify-center pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Particles */}
            {Array.from({ length: 36 }).map((_, i) => {
              const isLime = i % 2 === 0;
              const left = Math.random() * 100;
              const delay = Math.random() * 0.4;
              const duration = 1.8 + Math.random() * 0.9;
              const size = 6 + Math.random() * 6;
              const rotate = Math.random() * 360;
              return (
                <motion.span
                  key={i}
                  className="absolute top-0 rounded-sm"
                  style={{
                    left: `${left}%`,
                    width: size,
                    height: size,
                    background: isLime ? "hsl(var(--lime))" : "hsl(var(--primary))",
                    boxShadow: isLime
                      ? "0 0 8px hsl(var(--lime) / 0.7)"
                      : "0 0 8px hsl(var(--primary) / 0.7)",
                  }}
                  initial={{ y: -40, opacity: 0, rotate: 0 }}
                  animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate }}
                  transition={{ duration, delay, ease: "easeIn" }}
                />
              );
            })}

            {/* Card de parabéns */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="relative px-6 py-4 rounded-2xl border border-primary/40 backdrop-blur-md text-center"
              style={{ background: "hsl(var(--primary) / 0.15)" }}
            >
              <div className="text-[18px] font-semibold text-foreground">
                Treino concluído! 💪
              </div>
              <div className="text-[12px] text-muted-foreground mt-1">
                Excelente trabalho hoje.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
