interface BottomNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: "treino", icon: "🏋️", label: "Treino" },
  { id: "historico", icon: "📅", label: "Histórico" },
  { id: "evolucao", icon: "📊", label: "Evolução" },
  { id: "prog", icon: "📈", label: "Progressão" },
  { id: "perfil", icon: "👤", label: "Perfil" },
];

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  return (
    <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-[12px] border-t border-border flex z-[100] pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onPageChange(item.id)}
          className={`flex-1 flex flex-col items-center py-[8px] pb-[10px] gap-[2px] bg-transparent border-none transition-colors duration-150 ${
            currentPage === item.id ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <span className="text-[18px] leading-none">{item.icon}</span>
          <span className="text-[9px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
