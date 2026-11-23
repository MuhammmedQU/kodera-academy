import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4338CA]">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-[#18181B]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
