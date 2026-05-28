// Re-export the Lovable Cloud managed client so the whole app shares a single
// auth/session instance (avoids multiple GoTrueClient warnings).
import { supabase } from '@/integrations/supabase/client';

export { supabase };

export type UserRole = 'trainer' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  height_m: number | null;
  created_at: string;
}
