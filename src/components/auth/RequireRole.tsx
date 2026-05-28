import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/supabase';
interface Props { role: UserRole; children: React.ReactNode; }
export function RequireRole({ role, children }: Props) {
  const { profile, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground text-sm animate-pulse">Carregando...</div></div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role !== role) return <Navigate to={profile.role === 'trainer' ? '/trainer' : '/student'} replace />;
  return <>{children}</>;
}
