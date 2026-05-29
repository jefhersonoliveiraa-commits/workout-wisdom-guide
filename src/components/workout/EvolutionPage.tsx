import { PerformanceView } from "@/components/workout/PerformanceView";
import type { DbWorkoutPlan } from "@/types/plan";

interface EvolutionPageProps {
  studentId: string;
  plan: DbWorkoutPlan | null | undefined;
}

export function EvolutionPage({ studentId, plan }: EvolutionPageProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
        Evolução de cargas
      </div>
      <PerformanceView studentId={studentId} plan={plan} />
    </div>
  );
}
