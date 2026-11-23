import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const styles: Record<AlertVariant, { box: string; icon: typeof Info; iconColor: string }> = {
  info: {
    box: 'border-[#4338CA]/20 bg-[#EEF2FF]/70 text-[#1E1B4B]',
    icon: Info,
    iconColor: 'text-[#4338CA]',
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  warning: {
    box: 'border-[#F59E0B]/40 bg-[#FEF3C7]/70 text-[#78350F]',
    icon: AlertTriangle,
    iconColor: 'text-[#D97706]',
  },
  error: {
    box: 'border-red-200 bg-red-50 text-red-950',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
};

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { box, icon: Icon, iconColor } = styles[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', box, className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
