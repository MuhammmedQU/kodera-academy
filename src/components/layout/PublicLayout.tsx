import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { BrandLogo, Button, ButtonLink } from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { usePlatformSettings } from '@/app/SettingsContext';
import { cn } from '@/lib/cn';
import { clientEnv } from '@/lib/env';

const navLinks = [
  { to: '/', label: 'Ana səhifə', end: true },
  { to: '/courses', label: 'Kurslar', end: false },
  { to: '/about', label: 'Akademiya haqqında', end: true },
];

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, justLoggedOut, acknowledgeLogout, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (justLoggedOut) {
      acknowledgeLogout();
    }
  }, [justLoggedOut, acknowledgeLogout]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9] text-[#18181B]">
      {clientEnv.isLocalSandbox && (
        <div
          data-testid="sandbox-mode-banner"
          className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-950"
        >
          Lokal Sandbox Rejimi — Yalnız lokal test mühiti (Canlı Supabase verilənlər bazası və e-poçt xidməti qoşulmayıb)
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="focus-visible:rounded-xl">
            <BrandLogo name={settings.academy_name} />
          </Link>

          <nav aria-label="Əsas naviqasiya" className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#EEF2FF] text-[#4338CA]'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-[#18181B]',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            {isLoading ? (
              <div className="h-9 w-36 animate-pulse rounded-lg bg-zinc-100" aria-hidden="true" />
            ) : user ? (
              <>
                {user.isAdmin ? (
                  <ButtonLink to="/admin" variant="secondary" size="sm">
                    <ShieldCheck className="h-4 w-4" />
                    Admin Panel
                  </ButtonLink>
                ) : user.isActiveStudent ? (
                  <ButtonLink to="/dashboard" variant="primary" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    Tələbə Paneli
                  </ButtonLink>
                ) : (
                  <ButtonLink to="/application-status" variant="outline" size="sm">
                    Müraciət Statusu
                  </ButtonLink>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Çıxış">
                  <LogOut className="h-4 w-4" />
                  Çıxış
                </Button>
              </>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm">
                  Daxil ol
                </ButtonLink>
                {settings.registration_enabled && (
                  <ButtonLink to="/register" variant="primary" size="sm">
                    Qeydiyyat
                  </ButtonLink>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 md:hidden"
            aria-label={mobileOpen ? 'Menyunu bağla' : 'Menyunu aç'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobil naviqasiya">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-3.5 py-2.5 text-sm font-medium',
                      isActive ? 'bg-[#EEF2FF] text-[#4338CA]' : 'text-zinc-700 hover:bg-zinc-100',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4">
              {user ? (
                <>
                  {user.isAdmin ? (
                    <ButtonLink
                      to="/admin"
                      variant="secondary"
                      className="w-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin Panel
                    </ButtonLink>
                  ) : user.isActiveStudent ? (
                    <ButtonLink
                      to="/dashboard"
                      variant="primary"
                      className="w-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Tələbə Paneli
                    </ButtonLink>
                  ) : (
                    <ButtonLink
                      to="/application-status"
                      variant="outline"
                      className="w-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Müraciət Statusu
                    </ButtonLink>
                  )}
                  <Button variant="ghost" className="w-full" onClick={handleLogout}>
                    Çıxış
                  </Button>
                </>
              ) : (
                <>
                  <ButtonLink
                    to="/login"
                    variant="outline"
                    className="w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    Daxil ol
                  </ButtonLink>
                  {settings.registration_enabled && (
                    <ButtonLink
                      to="/register"
                      variant="primary"
                      className="w-full"
                      onClick={() => setMobileOpen(false)}
                    >
                      Qeydiyyat müraciəti et
                    </ButtonLink>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <BrandLogo name={settings.academy_name} />
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
                {settings.academy_tagline}. Sadə izahlar, real həyat nümunələri və praktiki məşqlərlə
                proqramlaşdırmanı sıfırdan öyrənin.
              </p>
              {settings.contact_email && (
                <p className="mt-3 text-sm text-zinc-600">
                  Əlaqə:{' '}
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="font-medium text-[#4338CA] hover:underline"
                  >
                    {settings.contact_email}
                  </a>
                </p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#18181B]">Platforma</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li>
                  <Link to="/courses" className="hover:text-[#4338CA]">
                    Kurslar
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#4338CA]">
                    Akademiya haqqında
                  </Link>
                </li>
                {settings.registration_enabled && (
                  <li>
                    <Link to="/register" className="hover:text-[#4338CA]">
                      Qeydiyyat müraciəti
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/login" className="hover:text-[#4338CA]">
                    Tələbə girişi
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#18181B]">Hüquqi</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li>
                  <Link to="/privacy" className="hover:text-[#4338CA]">
                    Məxfilik siyasəti
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#4338CA]">
                    İstifadə şərtləri
                  </Link>
                </li>
                <li>
                  <Link to="/application-status" className="hover:text-[#4338CA]">
                    Müraciət statusu
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-zinc-100 pt-6 text-xs text-zinc-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {settings.academy_name}. Bütün hüquqlar qorunur.
            </p>
            <p>Çoxkurslu Proqramlaşdırma Təhsil Platforması</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
