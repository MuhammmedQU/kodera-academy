import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
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

export function StudentSettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Şifrə ən azı 8 simvol, hərf və rəqəmdən ibarət olmalıdır.');
      return;
    }
    if (password !== confirm) {
      setError('Şifrələr uyğun gəlmir.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Şifrə dəyişikliyi yalnız aktiv Supabase Auth mühitində icra olunur.');
      return;
    }

    setSaving(true);
    const { error: supaErr } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (supaErr) {
      setError(supaErr.message);
      return;
    }
    setPassword('');
    setConfirm('');
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
          <CardTitle className="flex items-center gap-2 text-base">
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
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Yeni şifrə"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Yeni şifrə təsdiqi"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button type="submit" variant="primary" isLoading={saving}>
              Şifrəni yenilə
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
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
