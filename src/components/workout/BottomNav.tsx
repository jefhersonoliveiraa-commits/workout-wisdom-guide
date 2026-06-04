import { Dumbbell, CalendarDays, TrendingUp, BarChart2, User } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: "treino", icon: Dumbbell, label: "Treino" },
  { id: "historico", icon: CalendarDays, label: "Histórico" },
  { id: "evolucao", icon: BarChart2, label: "Evolução" },
  { id: "prog", icon: TrendingUp, label: "Técnicas" },
  { id: "perfil", icon: User, label: "Perfil" },
];

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  return (
    <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-[12px] border-t border-border flex z-[100] pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const active = currentPage === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className="flex-1 min-h-[52px] flex flex-col items-center justify-center py-[8px] pb-[10px] gap-[3px] bg-transparent border-none transition-colors duration-150"
          >
            <div className="relative flex items-center justify-center w-[44px] h-[28px]">
              {active && (
                <motion.div
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-full bg-primary/15"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className={`relative z-10 transition-colors duration-150 ${
                  active ? "text-primary" : "text-muted-foreground/60"
                }`}
              />
            </div>
            <span
              className={`text-[9px] font-medium transition-colors duration-150 ${
                active ? "text-primary" : "text-muted-foreground/60"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
