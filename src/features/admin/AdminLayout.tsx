import { Outlet } from 'react-router-dom';
import {
  BookOpen,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import { DashboardLayout, type SidebarNavItem } from '@/components/layout/DashboardLayout';

const adminNav: SidebarNavItem[] = [
  { to: '/admin', label: 'Ümumi baxış', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  {
    to: '/admin/applications',
    label: 'Müraciətlər',
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  { to: '/admin/students', label: 'Tələbələr', icon: <Users className="h-4 w-4" /> },
  {
    to: '/admin/enrollments',
    label: 'Kurs təyinatları',
    icon: <GraduationCap className="h-4 w-4" />,
  },
  { to: '/admin/courses', label: 'Kurslar və CMS', icon: <BookOpen className="h-4 w-4" /> },
  {
    to: '/admin/settings',
    label: 'Platforma və WhatsApp',
    icon: <Settings className="h-4 w-4" />,
  },
  { to: '/admin/audit-logs', label: 'Audit jurnalı', icon: <FileClock className="h-4 w-4" /> },
];

export function AdminLayout() {
  return (
    <DashboardLayout
      title="Admin Paneli"
      badgeText="Admin"
      badgeVariant="amber"
      navItems={adminNav}
    >
      <Outlet />
    </DashboardLayout>
  );
}
