import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, LogOut, Menu, X } from 'lucide-react';
import { Badge, BrandLogo, Button, ButtonLink } from '@/components/ui';
import { useAuth } from '@/app/AuthContext';
import { usePlatformSettings } from '@/app/SettingsContext';
import { cn } from '@/lib/cn';
import { clientEnv } from '@/lib/env';

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

interface DashboardLayoutProps {
  title: string;
  badgeText: string;
  badgeVariant?: 'brand' | 'amber';
  navItems: SidebarNavItem[];
  children: ReactNode;
}

export function DashboardLayout({
  title,
  badgeText,
  badgeVariant = 'brand',
  navItems,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const renderNav = (onItemClick?: () => void) => (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={title}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onItemClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'text-zinc-700 hover:bg-zinc-100 hover:text-[#18181B]',
            )
          }
        >
          <span className="shrink-0" aria-hidden="true">
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const renderSidebarFooter = (onNavigate?: () => void) => (
    <div className="border-t border-zinc-100 p-4">
      <div className="mb-3 rounded-xl bg-[#FAFAF9] p-3">
        <p className="truncate text-sm font-semibold text-[#18181B]">
          {user?.profile.full_name}
        </p>
        <p className="truncate text-xs text-zinc-500">{user?.profile.email}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <ButtonLink
          to="/"
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={onNavigate}
        >
          <Globe className="h-4 w-4" />
          İctimai sayta keç
        </ButtonLink>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Hesabdan çıx
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FAFAF9] text-[#18181B]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-68 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-5">
          <Link to="/">
            <BrandLogo name={settings.academy_name} size="sm" />
          </Link>
          <Badge variant={badgeVariant}>{badgeText}</Badge>
        </div>

        {renderNav()}
        {renderSidebarFooter()}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="fixed inset-0 bg-[#18181B]/50 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4">
              <Link to="/" onClick={() => setSidebarOpen(false)}>
                <BrandLogo name={settings.academy_name} size="sm" />
              </Link>
              <button
                type="button"
                aria-label="Menyunu bağla"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(() => setSidebarOpen(false))}
            {renderSidebarFooter(() => setSidebarOpen(false))}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {clientEnv.isLocalSandbox && (
          <div
            data-testid="sandbox-mode-banner"
            className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-950"
          >
            Lokal Sandbox Rejimi — Yalnız lokal test mühiti (Canlı Supabase verilənlər bazası qoşulmayıb)
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-md lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Menyunu aç"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate font-display text-base font-bold">{title}</span>
          </div>
          <Badge variant={badgeVariant}>{badgeText}</Badge>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
