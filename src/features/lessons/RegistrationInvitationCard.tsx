import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface RegistrationInvitationCardProps {
  courseTitle?: string;
  restrictedModuleTitle?: string;
}

export function RegistrationInvitationCard({
  courseTitle,
  restrictedModuleTitle,
}: RegistrationInvitationCardProps) {
  return (
    <Card className="overflow-hidden border-[#4338CA]/30 bg-gradient-to-br from-[#18181B] via-[#1E1B4B] to-[#312E81] text-white shadow-lg">
      <CardContent className="p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F59E0B]/20 px-3 py-1 text-xs font-semibold text-[#FCD34D]">
          {restrictedModuleTitle ? (
            <>
              <Lock className="h-3.5 w-3.5" />
              Qeydiyyat tələb olunan modul
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Pulsuz giriş modullarını tamamladınız!
            </>
          )}
        </div>

        <h2 className="mt-4 font-display text-2xl font-extrabold text-white sm:text-3xl">
          {restrictedModuleTitle
            ? `"${restrictedModuleTitle}" modulunu açmaq üçün Kodera-ya qoşulun`
            : 'Öyrənməyə tam proqramla davam etməyə hazırsınız?'}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-indigo-100">
          {courseTitle
            ? `"${courseTitle}" kursunun ilk iki pulsuz modulu sizə tədris keyfiyyətimizi göstərmək üçün açıqdır.`
            : 'İlk iki pulsuz modul tədris üslubumuzu və sadə izah yanaşmamızı görməyiniz üçün açıqdır.'}{' '}
          Növbəti modullara keçmək üçün qeydiyyat müraciəti göndərin.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            'Bütün əlavə modullar, dövrlər, funksiyalar və praktiki mini-layihələr',
            'İnteraktiv məşqlər və server tərəfindən qiymətləndirilən bilik testləri (quiz)',
            'Şəxsi Tələbə Panelində tamamlanmış dərslər və irəliləyiş faizinin izlənilməsi',
            'Onlayn ödəniş tələb olunmur — müraciətiniz administrator tərəfindən yoxlanılır və təsdiqdən sonra kurs hesabınıza təyin olunur',
          ].map((point) => (
            <div
              key={point}
              className="flex items-start gap-2.5 rounded-xl bg-white/8 p-3.5 text-xs leading-relaxed text-indigo-50"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
              <span>{point}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link to="/register">
            <Button variant="accent" size="lg">
              Qeydiyyat müraciəti et
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              size="lg"
              className="border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              Artıq hesabım var — Daxil ol
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
