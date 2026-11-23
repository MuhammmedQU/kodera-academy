import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type { Course } from '@shared/types/domain';
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui';
import { usePlatformSettings } from '@/app/SettingsContext';
import { apiRequest, ApiError } from '@/lib/apiClient';
import { formatDifficultyAz, formatDurationAz } from '@/lib/formatters';

const FUTURE_TRACKS = [
  { name: 'Python', status: 'Aktiv kurs', active: true },
  { name: 'SQL', status: 'Hazırlanır / Kataloqda', active: true },
  { name: 'C++', status: 'Planlaşdırılır', active: false },
  { name: 'JavaScript', status: 'Planlaşdırılır', active: false },
  { name: 'Web Development', status: 'Planlaşdırılır', active: false },
  { name: 'Data Structures & Algorithms', status: 'Planlaşdırılır', active: false },
  { name: 'Data Science', status: 'Planlaşdırılır', active: false },
  { name: 'Machine Learning', status: 'Planlaşdırılır', active: false },
  { name: 'Artificial Intelligence', status: 'Planlaşdırılır', active: false },
];

export function HomePage() {
  const { settings } = usePlatformSettings();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<Course[]>('/api/public/courses', { auth: false, signal: controller.signal })
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setCourses([]);
        setCoursesError(err instanceof ApiError ? err.message : null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCourses(false);
      });
    return () => controller.abort();
  }, []);

  const primaryPython = courses.find((c) => c.programming_language === 'python') ?? courses[0];
  const firstLessonHref = primaryPython?.first_public_lesson_slug
    ? `/courses/${primaryPython.slug}/lessons/${primaryPython.first_public_lesson_slug}`
    : primaryPython
      ? `/courses/${primaryPython.slug}`
      : '/courses';

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-[#4338CA]/8 blur-3xl"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-7">
            <Badge variant="amber" className="mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              İlk 2 Python modulu qeydiyyatsız və pulsuzdur
            </Badge>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#18181B] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
              Proqramlaşdırmanı sıfırdan, sadə və anlaşılan dildə öyrən.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
              <strong>{settings.academy_name}</strong> — mürəkkəb texniki anlayışları lazımsız
              jarqon olmadan, real həyat nümunələri, sətirbəsətir kod izahları və dərhal tətbiq
              olunan interaktiv məşqlərlə öyrədən müasir proqramlaşdırma akademiyasıdır.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to={firstLessonHref} variant="primary" size="lg">
                Pulsuz 1-ci dərsə başla
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink to="/courses" variant="outline" size="lg">
                Kursları kəşf et
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              İlk versiyada onlayn ödəniş yoxdur. Əvvəlcə pulsuz dərsləri oxuyun, tədris keyfiyyətini
              özünüz qiymətləndirin, sonra qeydiyyat müraciəti edin.
            </p>
          </div>

          {/* Interactive Teaching Preview Card */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#18181B] text-zinc-100 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3 text-xs">
                <span className="flex items-center gap-2 font-mono text-zinc-300">
                  <Terminal className="h-4 w-4 text-[#F59E0B]" />
                  ilk_dersim.py
                </span>
                <Badge variant="amber">Modul 1 • Pulsuz</Badge>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-indigo-200">
{`ad = "Aysel"
hedef = "Python"

print("Salam,", ad)
print("Bu gün", hedef, "öyrənirik!")`}
              </pre>
              <div className="border-t border-zinc-800 bg-zinc-950 px-5 py-3.5">
                <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                  Nəticə
                </p>
                <p className="mt-1 font-mono text-xs text-emerald-300">
                  Salam, Aysel
                  <br />
                  Bu gün Python öyrənirik!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT IS FOR & TEACHING PHILOSOPHY */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Badge variant="brand">Niyə {settings.academy_name}?</Badge>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-[#18181B]">
            Yeni başlayanların öyrənmə çətinliyini aradan qaldıran metodologiya
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Məqsədimiz sizi yüzlərlə quru slaydla yormaq deyil — hər dərsdə bir əsas bacarığı tam
            başa düşməyinizi və öz əlinizlə kod yazmağınızı təmin etməkdir.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: BookOpen,
              title: 'Sıfırdan sadə izah',
              desc: 'Əvvəlcə "bu mövzu niyə lazımdır?" sualına gündəlik həyat nümunəsi ilə cavab veririk, sonra sintaksisi göstəririk.',
            },
            {
              icon: Code2,
              title: 'Sətirbəsətir aydınlıq',
              desc: 'Hər kod nümunəsindən sonra vacib sətirlərin niyə yazıldığı və yeni başlayanların tez-tez etdiyi xətalar izah olunur.',
            },
            {
              icon: Terminal,
              title: 'Brauzerdə dərhal praktika',
              desc: 'Əlavə proqram quraşdırmadan, birbaşa dərsin içində Python kodu yazın və avtomatik testlərlə yoxlayın.',
            },
            {
              icon: GraduationCap,
              title: 'İzlənilə bilən irəliləyiş',
              desc: 'Tələbə panelində tamamladığınız dərsləri, quiz nəticələrinizi və kurs faizinizi addım-addım izləyin.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4338CA]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 text-base">{item.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ACTIVE COURSES */}
      <section className="border-y border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="brand">Mövcud Kurslar</Badge>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-[#18181B]">
                Python ilə başlayın, gələcək sahələrə böyüyün
              </h2>
            </div>
            <ButtonLink to="/courses" variant="outline">
              Bütün kurslar
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          {loadingCourses ? (
            <div className="mt-8">
              <Spinner label="Kurslar yüklənir..." />
            </div>
          ) : coursesError ? (
            <Alert variant="warning" className="mt-8">
              {coursesError}
            </Alert>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {courses.map((course) => (
                <Card key={course.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{course.programming_language.toUpperCase()}</Badge>
                      <Badge variant="neutral">{formatDifficultyAz(course.difficulty)}</Badge>
                      {(course.public_module_count ?? 0) > 0 && (
                        <Badge variant="amber">
                          İlk {course.public_module_count} modul pulsuz
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2 text-xl">{course.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {course.subtitle || course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                      <span>{course.total_module_count ?? 0} modul</span>
                      <span>•</span>
                      <span>{course.total_lesson_count ?? 0} dərs</span>
                      <span>•</span>
                      <span>{formatDurationAz(course.estimated_duration_minutes)}</span>
                    </div>
                    <ButtonLink to={`/courses/${course.slug}`} variant="primary" className="w-full">
                      Kurs proqramına bax
                      <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-zinc-200 bg-[#FAFAF9] p-6">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-[#18181B]">
              <Layers className="h-4 w-4 text-[#4338CA]" />
              Çoxkurslu Akademiya Yol Xəritəsi
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Platformamız ilk gündən çoxkurslu arxitektura ilə qurulub. Yeni istiqamətlər mərhələli
              şəkildə əlavə olunur:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {FUTURE_TRACKS.map((track) => (
                <Badge key={track.name} variant={track.active ? 'brand' : 'neutral'}>
                  {track.name} — {track.status}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP HONEST ADMISSION JOURNEY */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="amber">Qəbul Prosesi</Badge>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-[#18181B]">
            Akademiyaya qoşulmaq necə işləyir?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-600">
            Şəffaf, sadə və nəzarətli 4 addım — heç bir gizli ödəniş və ya şişirdilmiş vəd yoxdur.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Pulsuz 2 modulu sına',
              desc: 'Qeydiyyatsız olaraq Python kursunun ilk 2 modulunu (8 tam dərs) oxuyun və məşqləri yoxlayın.',
            },
            {
              step: '02',
              title: 'Qeydiyyat müraciəti et',
              desc: 'Ad, email və öyrənmə məqsədinizlə müraciət göndərin. Hesabınız gözləmə statusunda yaranır.',
            },
            {
              step: '03',
              title: 'Administratorla əlaqə',
              desc: 'Status səhifəsində referans nömrənizlə WhatsApp üzərindən administratora yaza bilərsiniz.',
            },
            {
              step: '04',
              title: 'Təsdiq və kurs təyinatı',
              desc: 'Administrator müraciəti təsdiqləyir və sizə uyğun kursları Tələbə Panelinizə təyin edir.',
            },
          ].map((s) => (
            <Card key={s.step}>
              <CardHeader>
                <span className="font-mono text-2xl font-extrabold text-[#4338CA]">{s.step}</span>
                <CardTitle className="mt-1 text-base">{s.title}</CardTitle>
                <CardDescription className="leading-relaxed">{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-[#18181B] p-8 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
                <ShieldCheck className="h-4 w-4" />
                Öyrənməyə elə indi başlayın
              </div>
              <h3 className="font-display text-2xl font-extrabold sm:text-3xl">
                İlk Python dərsiniz cəmi bir klik məsafəsindədir.
              </h3>
              <p className="text-sm text-zinc-300">
                Qeydiyyat tələb olunmadan Modul 1 və Modul 2-ni oxuyun, ilk Python kodunuzu
                brauzerdə işə salın.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to={firstLessonHref} variant="accent" size="lg">
                <Compass className="h-4 w-4" />
                Pulsuz dərslərə başla
              </ButtonLink>
              {settings.registration_enabled && (
                <ButtonLink to="/register" variant="outlineLight" size="lg">
                  <CheckCircle2 className="h-4 w-4" />
                  Müraciət et
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
