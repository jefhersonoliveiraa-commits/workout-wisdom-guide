import { useMemo } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TopBarProps {
  viewingStudent?: string;
  onBack?: () => void;
}

export function TopBar({ viewingStudent, onBack }: TopBarProps) {
  const { profile, signOut } = useAuth();

  const todayLabel = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  }, []);

  return (
    <div className="flex-shrink-0 border-b border-border px-[18px] pt-[14px] pb-[10px] flex items-center justify-between bg-background">
      <div className="flex items-center gap-[10px]">
        {onBack && (
          <button onClick={onBack} className="text-muted-foreground mr-1 text-sm">←</button>
        )}
        <div className="w-[10px] h-[10px] rounded-full bg-primary flex-shrink-0" />
        <div>
          <div className="text-[15px] font-semibold text-foreground">Ficha de Treino</div>
          <div className="text-[11px] text-muted-foreground mt-[1px]">
            {viewingStudent
              ? `Visualizando: ${viewingStudent}`
              : profile
              ? `${profile.full_name}`
              : "Carregando..."}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-bg3 border border-border-bright rounded-[20px] px-3 py-1 text-[11px] text-muted-foreground font-mono">
          {todayLabel}
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          title="Sair"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
