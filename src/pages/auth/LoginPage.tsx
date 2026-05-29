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
import { Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({ email: z.string().email('Email inválido'), password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres') });
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const { error, data: authData } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) { toast.error('Email ou senha incorretos'); setIsLoading(false); return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
    navigate(profile?.role === 'trainer' ? '/trainer' : '/student', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Dumbbell className="h-6 w-6 text-primary" /></div>
          <CardTitle className="text-xl">Workout Wisdom</CardTitle>
          <CardDescription>Entre na sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Entrando...' : 'Entrar'}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">Não tem conta?{' '}<Link to="/signup" className="text-primary underline-offset-4 hover:underline">Cadastre-se</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
