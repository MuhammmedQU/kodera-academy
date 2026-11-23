import { ArrowLeft, Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4338CA]">
        <Compass className="h-7 w-7" />
      </div>
      <p className="text-sm font-bold tracking-wider text-[#4338CA] uppercase">404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-[#18181B]">
        Səhifə tapılmadı
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">
        Axtardığınız səhifə mövcud deyil, köçürülüb və ya giriş icazəsi tələb edir.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/" variant="primary">
          <ArrowLeft className="h-4 w-4" />
          Ana səhifəyə qayıt
        </ButtonLink>
        <ButtonLink to="/courses" variant="outline">
          Kurslara bax
        </ButtonLink>
      </div>
    </div>
  );
}
