import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { forgotPasswordSchema } from '@shared/validation/schemas';
import type { z } from 'zod';
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
import { apiRequest, ApiError } from '@/lib/apiClient';

type ForgotForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotForm) => {
    setServerError(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: values,
        auth: false,
      });
      setSubmittedMessage(res.message);
    } catch (err) {
      setServerError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Sorğu göndərilərkən xəta baş verdi.',
      );
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#4338CA]" />
            Şifrənin bərpası
          </CardTitle>
          <CardDescription>
            Qeydiyyatda istifadə etdiyiniz email ünvanını daxil edin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submittedMessage ? (
            <div className="space-y-4">
              <Alert variant="success" title="Sorğu qəbul edildi">
                {submittedMessage}
              </Alert>
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Giriş səhifəsinə qayıt
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {serverError && <Alert variant="error">{serverError}</Alert>}
              <Input
                label="Email ünvanı"
                type="email"
                required
                placeholder="adiniz@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
                Bərpa linki göndər
              </Button>
              <p className="text-center text-sm text-zinc-600">
                <Link to="/login" className="font-semibold text-[#4338CA] hover:underline">
                  Girişə qayıt
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
