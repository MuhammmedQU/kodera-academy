import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'brand' | 'amber' | 'success' | 'danger' | 'neutral' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
  brand: 'bg-[#EEF2FF] text-[#4338CA] ring-1 ring-inset ring-[#4338CA]/20',
  amber: 'bg-[#FEF3C7] text-[#92400E] ring-1 ring-inset ring-[#F59E0B]/30',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  neutral: 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-300/60',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        badgeStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
