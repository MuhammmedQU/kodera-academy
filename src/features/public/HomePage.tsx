import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Code2, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { usePlatformSettings } from '@/app/SettingsContext';

export function HomePage() {
  const { settings } = usePlatformSettings();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <Badge variant="amber" className="mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              İlk 2 Python modulu qeydiyyatsız və pulsuzdur
            </Badge>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#18181B] sm:text-5xl">
              Proqramlaşdırmanı sıfırdan, sadə və anlaşılan dildə öyrən.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600">
              {settings.academy_name} — mürəkkəb texniki anlayışları aydın izahlar, real həyat
              nümunələri və dərhal tətbiq olunan praktiki məşqlərlə öyrədən müasir proqramlaşdırma
              akademiyasıdır.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/courses">
                <Button variant="primary" size="lg">
                  Pulsuz dərslərə başla
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg">
                  Qeydiyyat müraciəti et
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <BookOpen className="h-6 w-6 text-[#4338CA]" />
                <CardTitle className="mt-2">Sadə və ardıcıl tədris</CardTitle>
                <CardDescription>
                  Hər dərs sıfırdan başlayanlar üçün əvvəlcə &ldquo;niyə lazımdır?&rdquo;, sonra
                  &ldquo;necə işləyir?&rdquo; məntiqi ilə qurulur.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Code2 className="h-6 w-6 text-[#4338CA]" />
                <CardTitle className="mt-2">İnteraktiv praktika</CardTitle>
                <CardDescription>
                  Dərslərin içində kod nümunələri, addım-addım izahlar, brauzerdə icra olunan məşqlər
                  və bilik yoxlama testləri mövcuddur.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <ShieldCheck className="h-6 w-6 text-[#F59E0B]" />
                <CardTitle className="mt-2">Nəzarətli tələbə qəbulu</CardTitle>
                <CardDescription>
                  İlk iki modulu sərbəst sınayın, bəyəndikdən sonra müraciət edin və administrator
                  təsdiqi ilə fərdi kurs girişi əldə edin.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-zinc-500">
                İlk mərhələdə Python, gələcəkdə C++, SQL, JS, Web, DSA və AI kursları.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
