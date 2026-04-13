import { useMemo } from "react";

export function TopBar() {
  const todayLabel = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  }, []);

  return (
    <div className="flex-shrink-0 border-b border-border px-[18px] pt-[14px] pb-[10px] flex items-center justify-between bg-background">
      <div className="flex items-center gap-[10px]">
        <div className="w-[10px] h-[10px] rounded-full bg-primary flex-shrink-0" />
        <div>
          <div className="text-[15px] font-semibold text-foreground">Ficha de Treino</div>
          <div className="text-[11px] text-muted-foreground mt-[1px]">Jefherson • Recomposição Corporal</div>
        </div>
      </div>
      <div className="bg-bg3 border border-border-bright rounded-[20px] px-3 py-1 text-[11px] text-muted-foreground font-mono">
        {todayLabel}
      </div>
    </div>
  );
}
