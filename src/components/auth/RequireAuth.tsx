import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground text-sm animate-pulse">Carregando...</div></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
