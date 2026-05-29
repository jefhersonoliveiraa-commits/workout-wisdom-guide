import { Link, useLocation } from "react-router-dom";
import { Users, ClipboardList, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
export function TrainerNav() {
  const { pathname } = useLocation(); const { signOut, profile } = useAuth();
  return (
    <div className="flex-shrink-0 border-b border-border px-4 pt-3 pb-3 flex items-center justify-between bg-background">
      <div className="flex items-center gap-2">
        <div className="w-[10px] h-[10px] rounded-full bg-primary" />
        <span className="text-[14px] font-semibold text-foreground">Workout Wisdom</span>
        {profile && <span className="text-[11px] text-muted-foreground ml-1">· {profile.full_name}</span>}
      </div>
      <div className="flex items-center gap-1">
        <Link to="/trainer" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors ${pathname === '/trainer' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Users size={14} />Alunos</Link>
        <Link to="/trainer/plans/new" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] transition-colors ${pathname.startsWith('/trainer/plans') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><ClipboardList size={14} />Nova Ficha</Link>
        <button onClick={signOut} className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"><LogOut size={14} /></button>
      </div>
    </div>
  );
}
