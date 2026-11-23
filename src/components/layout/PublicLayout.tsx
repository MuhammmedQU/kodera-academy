import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { BrandLogo, Button } from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { usePlatformSettings } from '@/app/SettingsContext';
import { cn } from '@/lib/cn';

const navLinks = [
  { to: '/', label: 'Ana səhifə', end: true },
  { to: '/courses', label: 'Kurslar', end: false },
  { to: '/about', label: 'Akademiya haqqında', end: true },
];

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9] text-[#18181B]">
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
            {user ? (
              <>
                {user.isAdmin ? (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm">
                      <ShieldCheck className="h-4 w-4" />
                      Admin Panel
                    </Button>
                  </Link>
                ) : user.isActiveStudent ? (
                  <Link to="/dashboard">
                    <Button variant="primary" size="sm">
                      <LayoutDashboard className="h-4 w-4" />
                      Tələbə Paneli
                    </Button>
                  </Link>
                ) : (
                  <Link to="/application-status">
                    <Button variant="outline" size="sm">
                      Müraciət Statusu
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Çıxış">
                  <LogOut className="h-4 w-4" />
                  Çıxış
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Daxil ol
                  </Button>
                </Link>
                {settings.registration_enabled && (
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Qeydiyyat
                    </Button>
                  </Link>
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
                    <Link to="/admin" onClick={() => setMobileOpen(false)}>
                      <Button variant="secondary" className="w-full">
                        Admin Panel
                      </Button>
                    </Link>
                  ) : user.isActiveStudent ? (
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" className="w-full">
                        Tələbə Paneli
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/application-status" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Müraciət Statusu
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" className="w-full" onClick={handleLogout}>
                    Çıxış
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Daxil ol
                    </Button>
                  </Link>
                  {settings.registration_enabled && (
                    <Link to="/register" onClick={() => setMobileOpen(false)}>
                      <Button variant="primary" className="w-full">
                        Qeydiyyat müraciəti et
                      </Button>
                    </Link>
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
              <h4 className="text-sm font-bold text-[#18181B]">Platforma</h4>
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
                <li>
                  <Link to="/register" className="hover:text-[#4338CA]">
                    Qeydiyyat müraciəti
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#4338CA]">
                    Tələbə girişi
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#18181B]">Hüquqi</h4>
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
