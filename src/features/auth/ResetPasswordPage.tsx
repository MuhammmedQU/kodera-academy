import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { resetPasswordSchema } from '@shared/validation/schemas';
import type { z } from 'zod';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
} from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase';

type ResetForm = z.infer<typeof resetPasswordSchema>;
type RecoveryPhase = 'checking' | 'ready' | 'invalid' | 'done';

export function ResetPasswordPage() {
  const [phase, setPhase] = useState<RecoveryPhase>('checking');
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    if (hashParams.get('error') || searchParams.get('error')) {
      setServerError('Bərpa linki etibarsızdır və ya vaxtı bitib. Yenidən şifrə bərpa sorğusu göndərin.');
      setPhase('invalid');
      return;
    }

    if (!supabase) {
      setServerError(
        'Şifrə yeniləməsi yalnız aktiv Supabase Auth bərpa linki vasitəsilə icra olunur.',
      );
      setPhase('invalid');
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setPhase('ready');
      }
    });

    void (async () => {
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setServerError('Bərpa linki etibarsızdır və ya vaxtı bitib.');
          setPhase('invalid');
          return;
        }
        setPhase('ready');
        return;
      }

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (!active) return;
        if (error) {
          setServerError('Bərpa linki etibarsızdır və ya vaxtı bitib.');
          setPhase('invalid');
          return;
        }
        setPhase('ready');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setPhase('ready');
      } else {
        setServerError(
          'Aktiv şifrə bərpa sessiyası tapılmadı. Zəhmət olmasa emailinizdəki bərpa linkindən daxil olun.',
        );
        setPhase('invalid');
      }
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ResetForm) => {
    setServerError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setServerError(
        'Şifrə yeniləməsi yalnız aktiv Supabase Auth bərpa linki vasitəsilə icra olunur.',
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('different from the old password')) {
        setServerError('Yeni şifrə əvvəlki şifrədən fərqli olmalıdır.');
      } else {
        setServerError('Bərpa linki etibarsızdır və ya vaxtı bitib. Yenidən bərpa sorğusu göndərin.');
      }
      return;
    }

    // Close the temporary recovery session so user signs in cleanly with the new password
    await supabase.auth.signOut().catch(() => {});
    setPhase('done');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card>
        <CardHeader>
          <CardTitle as="h1" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#4338CA]" />
            Yeni şifrə təyin et
          </CardTitle>
          <CardDescription>Hesabınız üçün güclü yeni şifrə seçin.</CardDescription>
        </CardHeader>
        <CardContent>
          {phase === 'checking' ? (
            <Spinner label="Bərpa linki yoxlanılır..." />
          ) : phase === 'done' ? (
            <div className="space-y-4">
              <Alert variant="success" title="Şifrə yeniləndi">
                Yeni şifrəniz təhlükəsiz şəkildə saxlanıldı. İndi yeni şifrənizlə hesabınıza daxil
                ola bilərsiniz.
              </Alert>
              <ButtonLink to="/login" variant="primary" className="w-full">
                Daxil ol
              </ButtonLink>
            </div>
          ) : phase === 'invalid' ? (
            <div className="space-y-4">
              <Alert variant="error" title="Bərpa linki etibarsızdır">
                {serverError || 'Bərpa linki etibarsızdır və ya vaxtı bitib.'}
              </Alert>
              <ButtonLink to="/forgot-password" variant="primary" className="w-full">
                Yeni bərpa linki istə
              </ButtonLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {serverError && <Alert variant="error">{serverError}</Alert>}
              <Input
                label="Yeni şifrə"
                type="password"
                required
                autoComplete="new-password"
                hint="Ən azı 8 simvol, hərf və rəqəm."
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Yeni şifrənin təsdiqi"
                type="password"
                required
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
                Şifrəni yenilə
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
