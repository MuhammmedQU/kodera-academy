import { Outlet } from 'react-router-dom';
import { BarChart3, BookOpen, LayoutDashboard, Settings, User } from 'lucide-react';
import { DashboardLayout, type SidebarNavItem } from '@/components/layout/DashboardLayout';

const studentNav: SidebarNavItem[] = [
  { to: '/dashboard', label: 'Ümumi baxış', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { to: '/dashboard/courses', label: 'Mənim kurslarım', icon: <BookOpen className="h-4 w-4" /> },
  { to: '/dashboard/progress', label: 'Öyrənmə irəliləyişi', icon: <BarChart3 className="h-4 w-4" /> },
  { to: '/dashboard/profile', label: 'Profilim', icon: <User className="h-4 w-4" /> },
  { to: '/dashboard/settings', label: 'Hesab tənzimləmələri', icon: <Settings className="h-4 w-4" /> },
];

export function StudentLayout() {
  return (
    <DashboardLayout
      title="Tələbə Paneli"
      badgeText="Tələbə"
      badgeVariant="brand"
      navItems={studentNav}
    >
      <Outlet />
    </DashboardLayout>
  );
}
