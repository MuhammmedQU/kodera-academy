import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { usePlatformSettings } from '@/app/SettingsContext';

export function PrivacyPolicyPage() {
  const { settings } = usePlatformSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <h1 className="font-display text-3xl font-extrabold text-[#18181B]">Məxfilik Siyasəti</h1>
      <Card>
        <CardHeader>
          <CardTitle>{settings.academy_name} — Şəxsi Məlumatların Qorunması</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-zinc-700">
          <p>
            <strong>1. Toplanan məlumatlar:</strong> Qeydiyyat müraciəti zamanı təqdim etdiyiniz ad
            və soyad, email ünvanı, istəyə bağlı telefon nömrəsi, öyrənmə məqsədi və təhsil
            irəliləyişi (tamamlanmış dərslər, məşq və quiz nəticələri) yalnız tədris prosesini
            təmin etmək məqsədilə saxlanılır.
          </p>
          <p>
            <strong>2. Təhlükəsizlik və izolyasiya:</strong> Şifrələr açıq mətn şəklində heç vaxt
            saxlanılmır (Supabase Auth şifrələməsi istifadə olunur). Verilənlər bazasında Row Level
            Security (RLS) qaydaları sayəsində heç bir tələbə başqa tələbənin şəxsi məlumatlarını,
            müraciət statusunu və ya irəliləyişini görə bilməz.
          </p>
          <p>
            <strong>3. Brauzerdə kod icrası:</strong> İnteraktiv Python məşqlərində yazdığınız kod
            yalnız öz brauzerinizin Web Worker mühitində icra olunur.
          </p>
          <p>
            <strong>4. WhatsApp əlaqəsi:</strong> Qeydiyyatdan sonra təqdim edilən WhatsApp düyməsi
            avtomatik mesaj göndərmir; mesajı göndərib-göndərməmək tamamilə sizin seçiminizdir.
          </p>
          <p>
            <strong>5. Əlaqə:</strong> Məlumatlarınızla bağlı suallar üçün rəsmi email:{' '}
            <strong>{settings.contact_email || 'info@kodera.academy'}</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
