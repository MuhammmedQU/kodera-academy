import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import type { z } from 'zod';
import { profileUpdateSchema } from '@shared/validation/schemas';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatAccountStatusAz } from '@/lib/formatters';

type ProfileFormInput = z.input<typeof profileUpdateSchema>;
type ProfileFormOutput = z.infer<typeof profileUpdateSchema>;

export function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileUpdateSchema),
    values: {
      full_name: user?.profile.full_name ?? '',
      phone: user?.profile.phone ?? '',
      learning_goals: user?.profile.learning_goals ?? '',
    },
  });

  const onSubmit = async (values: ProfileFormOutput) => {
    setError(null);
    setFeedback(null);
    try {
      await apiRequest('/api/student/profile', {
        method: 'PATCH',
        body: {
          full_name: values.full_name,
          phone: values.phone ?? null,
          learning_goals: values.learning_goals ?? null,
        },
      });
      await refreshUser();
      setFeedback('Profil məlumatlarınız yeniləndi.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil yenilənmədi.');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#18181B]">Tələbə Profili</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Şəxsi məlumatlarınızı və öyrənmə məqsədlərinizi yeniləyə bilərsiniz.
        </p>
      </div>

      {feedback && <Alert variant="success">{feedback}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle as="h2">Hesab məlumatları</CardTitle>
            {user && (
              <Badge variant="success">{formatAccountStatusAz(user.profile.account_status)}</Badge>
            )}
          </div>
          <CardDescription>
            Email: <strong>{user?.profile.email}</strong>
            {user?.application ? ` • Müraciət kodu: ${user.application.reference_code}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Ad və soyad"
              required
              autoComplete="name"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Telefon nömrəsi"
              type="tel"
              autoComplete="tel"
              placeholder="+994 50 123 45 67"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Textarea
              label="Öyrənmə məqsədi"
              rows={3}
              error={errors.learning_goals?.message}
              {...register('learning_goals')}
            />
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Save className="h-4 w-4" />
              Dəyişiklikləri yadda saxla
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
