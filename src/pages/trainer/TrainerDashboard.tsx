import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserPlus, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TrainerNav } from "@/components/trainer/TrainerNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StudentInfo {
  id: string;
  full_name: string;
  planName: string | null;
  lastSession: string | null;
}

interface ProfileInfo {
  id: string;
  full_name: string;
}

async function fetchStudents(trainerId: string): Promise<StudentInfo[]> {
  const { data: links } = await supabase
    .from('trainer_student')
    .select('student_id')
    .eq('trainer_id', trainerId);

  if (!links || links.length === 0) return [];

  const studentIds = links.map(l => l.student_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', studentIds);

  const { data: plans } = await supabase
    .from('workout_plans')
    .select('student_id, name')
    .in('student_id', studentIds)
    .eq('is_active', true);

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('student_id, session_date')
    .in('student_id', studentIds)
    .order('session_date', { ascending: false });

  return (profiles ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    planName: plans?.find(pl => pl.student_id === p.id)?.name ?? null,
    lastSession: sessions?.find(s => s.student_id === p.id)?.session_date ?? null,
  }));
}

async function fetchAllStudentProfiles(): Promise<ProfileInfo[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student');
  if (error) return [];
  return data ?? [];
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [inviteId, setInviteId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const { data: students = [], refetch } = useQuery({
    queryKey: ['trainer-students', user?.id],
    queryFn: () => fetchStudents(user!.id),
    enabled: !!user?.id,
  });

  const { data: allStudentProfiles = [] } = useQuery({
    queryKey: ['all-student-profiles'],
    queryFn: fetchAllStudentProfiles,
    enabled: !!user?.id,
  });

  const linkedIds = new Set(students.map(s => s.id));
  const availableStudents = allStudentProfiles.filter(p => !linkedIds.has(p.id));

  const handleLinkById = async (studentId: string) => {
    if (!user?.id || !studentId.trim()) return;
    setLinking(true);
    setLinkingId(studentId);
    const { error } = await supabase.from('trainer_student').insert({
      trainer_id: user.id,
      student_id: studentId.trim(),
    });
    if (error) {
      toast.error('Erro ao vincular aluno: ' + error.message);
    } else {
      toast.success('Aluno vinculado com sucesso!');
      refetch();
      setInviteId("");
    }
    setLinking(false);
    setLinkingId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TrainerNav />
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold text-foreground">Meus Alunos</h1>
          <Link to="/trainer/plans/new">
            <Button size="sm" className="gap-1.5"><Plus size={14} />Nova Ficha</Button>
          </Link>
        </div>

        {/* Vincular por ID manual */}
        <div className="bg-bg2 border border-border rounded-lg p-4 mb-6">
          <div className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <UserPlus size={14} />Vincular Aluno (por ID)
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            O aluno deve se cadastrar primeiro e compartilhar seu ID de usuário com você.
          </p>
          <div className="flex gap-2">
            <Input
              value={inviteId}
              onChange={(e) => setInviteId(e.target.value)}
              placeholder="ID do aluno (UUID)"
              className="flex-1 text-[13px]"
            />
            <Button
              size="sm"
              onClick={() => handleLinkById(inviteId)}
              disabled={linking || !inviteId.trim()}
            >
              Vincular
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Para encontrar seu ID: o aluno deve ir em <span className="font-medium">Perfil &gt; copiar ID de usuário</span>.
          </p>
        </div>

        {/* Alunos vinculados */}
        <h2 className="text-[15px] font-semibold text-foreground mb-3">Alunos Vinculados</h2>
        {students.length === 0 ? (
          <div className="bg-bg2 border border-border rounded-lg p-8 text-center mb-6">
            <div className="text-[40px] mb-3">👥</div>
            <h3 className="text-[16px] font-medium text-foreground mb-2">Nenhum aluno ainda</h3>
            <p className="text-[13px] text-muted-foreground">Vincule alunos usando o ID deles acima ou na seção abaixo.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {students.map(student => (
              <Link
                key={student.id}
                to={`/trainer/students/${student.id}`}
                className="bg-bg2 border border-border rounded-lg p-4 flex items-center gap-3 hover:border-primary/40 transition-colors block"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[16px] font-semibold text-primary flex-shrink-0">
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-foreground">{student.full_name}</div>
                  <div className="text-[11px] text-muted-foreground mt-[2px]">
                    {student.planName ? `Ficha: ${student.planName}` : "Sem ficha ativa"}
                    {student.lastSession && ` · Último treino: ${new Date(student.lastSession + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Alunos disponíveis para vincular */}
        {availableStudents.length > 0 && (
          <>
            <h2 className="text-[15px] font-semibold text-foreground mb-3">Alunos disponíveis para vincular</h2>
            <div className="space-y-2 mb-6">
              {availableStudents.map(profile => (
                <div
                  key={profile.id}
                  className="bg-bg2 border border-border rounded-lg p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[16px] font-semibold text-muted-foreground flex-shrink-0">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-foreground">{profile.full_name}</div>
                    <div className="text-[11px] text-muted-foreground mt-[2px] truncate">{profile.id}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLinkById(profile.id)}
                    disabled={linking && linkingId === profile.id}
                    className="flex-shrink-0"
                  >
                    {linking && linkingId === profile.id ? 'Vinculando...' : 'Vincular'}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
