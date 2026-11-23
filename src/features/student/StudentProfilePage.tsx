import { useState } from 'react';
import { Save } from 'lucide-react';
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

export function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.profile.full_name ?? '');
  const [phone, setPhone] = useState(user?.profile.phone ?? '');
  const [goals, setGoals] = useState(user?.profile.learning_goals ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await apiRequest('/api/student/profile', {
        method: 'PATCH',
        body: {
          full_name: fullName,
          phone: phone || null,
          learning_goals: goals || null,
        },
      });
      await refreshUser();
      setFeedback('Profil məlumatlarınız yeniləndi.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil yenilənmədi.');
    } finally {
      setSaving(false);
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
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Hesab məlumatları</CardTitle>
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
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Ad və soyad"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Telefon nömrəsi"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Textarea
              label="Öyrənmə məqsədi"
              rows={3}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
            <Button type="submit" variant="primary" isLoading={saving}>
              <Save className="h-4 w-4" />
              Dəyişiklikləri yadda saxla
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
