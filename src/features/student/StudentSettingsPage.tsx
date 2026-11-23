import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import type { z } from 'zod';
import { resetPasswordSchema } from '@shared/validation/schemas';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { getSupabaseClient } from '@/lib/supabase';

type PasswordForm = z.infer<typeof resetPasswordSchema>;

function mapSupabasePasswordError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('different from the old password')) {
    return 'Yeni şifrə əvvəlki şifrədən fərqli olmalıdır.';
  }
  if (lower.includes('reauthentication') || lower.includes('nonce')) {
    return 'Təhlükəsizlik siyasətinə görə şifrə dəyişmək üçün yenidən daxil olmalı və ya "Şifrəni unutdum" bərpa linkindən istifadə etməlisiniz.';
  }
  if (lower.includes('weak') || lower.includes('password')) {
    return 'Şifrə təhlükəsizlik tələblərinə cavab vermir. Daha güclü şifrə seçin.';
  }
  return 'Şifrə yenilənərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
}

export function StudentSettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: PasswordForm) => {
    setError(null);
    setFeedback(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Şifrə dəyişikliyi yalnız aktiv Supabase Auth mühitində icra olunur.');
      return;
    }

    const { error: supaErr } = await supabase.auth.updateUser({ password: values.password });
    if (supaErr) {
      setError(mapSupabasePasswordError(supaErr.message));
      return;
    }
    reset();
    setFeedback('Şifrəniz uğurla yeniləndi.');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">Hesab Tənzimləmələri</h1>
        <p className="mt-1 text-sm text-zinc-600">Şifrə təhlükəsizliyi və sessiya idarəetməsi.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5 text-[#4338CA]" />
            Şifrəni yenilə
          </CardTitle>
          <CardDescription>
            Təhlükəsizlik üçün ən azı 8 simvol, hərf və rəqəm qarışığından istifadə edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback && (
            <Alert variant="success" className="mb-4">
              {feedback}
            </Alert>
          )}
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Yeni şifrə"
              type="password"
              required
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Yeni şifrə təsdiqi"
              type="password"
              required
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Şifrəni yenilə
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Giriş və Sessiya
          </CardTitle>
          <CardDescription>
            Kurs girişləriniz administrator tərəfindən idarə olunur. Hesabdan çıxmaq üçün aşağıdakı
            düymədən istifadə edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="danger"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            <LogOut className="h-4 w-4" />
            Bütün sessiyadan çıx
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
