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
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors mr-1 text-sm">
            ←
          </button>
        )}
        {/* Animated pulse dot */}
        <div className="relative flex-shrink-0 w-[10px] h-[10px]">
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
          <span className="relative block w-[10px] h-[10px] rounded-full bg-primary" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-foreground">Ficha de Treino</div>
          <div className="text-[10px] text-muted-foreground mt-[1px]">
            {viewingStudent
              ? `Visualizando: ${viewingStudent}`
              : profile
              ? profile.full_name
              : "Carregando..."}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-bg3 border border-border-bright rounded-full px-3 py-1 text-[11px] text-foreground font-mono font-medium">
          {todayLabel}
        </div>
        <button
          onClick={signOut}
          className="p-[7px] rounded-full text-muted-foreground hover:text-foreground hover:bg-bg3 transition-all duration-150 border border-transparent hover:border-border"
          title="Sair"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
