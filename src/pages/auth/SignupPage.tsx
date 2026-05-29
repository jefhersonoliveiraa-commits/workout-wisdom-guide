import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Mail } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  full_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role: z.enum(['trainer', 'student']),
  height_m: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(1.0).max(2.5).optional()
  ),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  });
  const role = watch('role');

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: data.full_name,
          role: data.role,
          height_m: data.height_m ? String(data.height_m) : '',
        },
      },
    });
    if (error || !authData.user) {
      toast.error(error?.message ?? 'Erro ao criar conta');
      setIsLoading(false);
      return;
    }
    setSubmittedEmail(data.email);
    setEmailSent(true);
    setIsLoading(false);
  }

  if (emailSent) {
    return (
      <div className="min-h-screen overflow-y-auto flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Verifique seu email</CardTitle>
            <CardDescription>Workout Wisdom Guide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Enviamos um link de confirmação para{' '}
              <span className="font-medium text-foreground">{submittedEmail}</span>.
              Clique no link para ativar sua conta e depois faça login.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Verifique também a pasta de spam caso não encontre o email.
            </p>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Criar Conta</CardTitle>
          <CardDescription>Workout Wisdom Guide</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input placeholder="Seu nome" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input type="password" placeholder="••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de conta</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['student', 'trainer'] as const).map((r) => (
                  <label key={r} className={`flex cursor-pointer items-center justify-center rounded-md border p-2.5 text-sm transition-colors ${role === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                    <input type="radio" value={r} {...register('role')} className="sr-only" />
                    {r === 'student' ? 'Aluno' : 'Treinador'}
                  </label>
                ))}
              </div>
            </div>
            {role === 'student' && (
              <div className="space-y-1.5">
                <Label>Altura (m) — para IMC</Label>
                <Input type="number" step="0.01" placeholder="1.75" {...register('height_m')} />
                {errors.height_m && <p className="text-xs text-destructive">{errors.height_m.message}</p>}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar conta'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
