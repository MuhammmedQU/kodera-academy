import { ArrowRight, BookOpen, Compass, ShieldCheck, Target } from 'lucide-react';
import { Badge, ButtonLink, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { usePlatformSettings } from '@/app/SettingsContext';

export function AboutPage() {
  const { settings } = usePlatformSettings();

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <Badge variant="brand">Akademiya Haqqında</Badge>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[#18181B] sm:text-4xl">
          Proqramlaşdırmanı çətinləşdirmədən, keyfiyyətli tədrislə öyrədirik.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-600">
          <strong>{settings.academy_name}</strong> proqramlaşdırmaya sıfırdan başlayan tələbələrin
          qarşılaşdığı əsas problemi — mürəkkəb, quru və əlaqəsiz izahları — aradan qaldırmaq üçün
          yaradılıb. Bizim üstünlüyümüz dərs sayının çoxluğu yox, hər bir dərsin aydınlığı və
          praktikliyi üzərində qurulub.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <BookOpen className="h-6 w-6 text-[#4338CA]" />
            <CardTitle as="h2" className="mt-2">
              Tədris Fəlsəfəmiz
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-zinc-600">
            Hər dərsdə əvvəlcə anlayışın gündəlik həyatda niyə lazım olduğu izah edilir, sonra
            addım-addım kod göstərilir, tipik xətalar qeyd olunur və dərhal məşq verilir.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Target className="h-6 w-6 text-[#F59E0B]" />
            <CardTitle as="h2" className="mt-2">
              Çoxkurslu Vizyon
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-zinc-600">
            İlk kursumuz Python olsa da, platformamız C++, SQL, JavaScript, Web Development,
            Alqoritmlər, Data Science, Machine Learning və Süni İntellekt kurslarına genişlənəcək
            şəkildə qurulub.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <CardTitle as="h2" className="mt-2">
              Şəffaf Qəbul Modeli
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-zinc-600">
            İlk iki Python modulu hər kəs üçün pulsuzdur. Tədris keyfiyyətimizlə tanış olduqdan
            sonra qeydiyyat müraciəti edirsiniz; administrator təsdiqindən sonra uyğun kurslar
            hesabınıza təyin olunur.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <div>
          <h2 className="font-display text-xl font-bold text-[#18181B]">
            Pulsuz dərslərlə elə indi tanış olun
          </h2>
          {settings.contact_email && (
            <p className="mt-1 text-sm text-zinc-600">
              Rəsmi əlaqə: <strong>{settings.contact_email}</strong>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/courses" variant="primary">
            <Compass className="h-4 w-4" />
            Kurslara bax
          </ButtonLink>
          {settings.registration_enabled && (
            <ButtonLink to="/register" variant="outline">
              Müraciət et
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
