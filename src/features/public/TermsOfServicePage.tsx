import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { usePlatformSettings } from '@/app/SettingsContext';

export function TermsOfServicePage() {
  const { settings } = usePlatformSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
      <h1 className="font-display text-3xl font-extrabold text-[#18181B]">İstifadə Şərtləri</h1>
      <Card>
        <CardHeader>
          <CardTitle as="h2">{settings.academy_name} Platformasından İstifadə Qaydaları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-zinc-700">
          <p>
            <strong>1. İctimai və məhdud məzmun:</strong> Platformada ictimai kimi işarələnmiş giriş
            modulları qeydiyyatsız oxuna bilər. Tam kurs materiallarına giriş yalnız administrator
            təsdiqi və fərdi kurs təyinatından sonra verilir.
          </p>
          <p>
            <strong>2. Qəbul və təsdiq prosesi:</strong> Qeydiyyat müraciətinin göndərilməsi və ya
            WhatsApp üzərindən administratorla əlaqə saxlanması avtomatik qəbul və ya kurs girişi
            yaratmır. Təsdiq və kurs təyinatı ayrıca inzibati qərarlardır.
          </p>
          <p>
            <strong>3. Ödənişlər:</strong> Platformanın ilk versiyasında onlayn ödəniş sistemi
            mövcud deyil.
          </p>
          <p>
            <strong>4. Hesab təhlükəsizliyi və intizam:</strong> Hesab giriş məlumatlarının məxfiliyi
            istifadəçinin məsuliyyətindədir. Platformanın təhlükəsizliyini pozmağa və ya icazəsiz
            materiallara çıxış əldə etməyə yönəlmiş cəhdlər hesabın dondurulmasına səbəb ola bilər.
          </p>
          <p>
            <strong>5. Müəllif hüquqları:</strong> Bütün dərs mətnləri, izahlar, məşqlər və testlər{' '}
            {settings.academy_name} akademiyasına məxsusdur və icazəsiz kommersiya yayımı qadağandır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
