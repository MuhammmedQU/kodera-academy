import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SpinnerProps {
  label?: string;
  className?: string;
  fullPage?: boolean;
}

export function Spinner({ label = 'Yüklənir...', className, fullPage = false }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-zinc-600',
        fullPage ? 'min-h-[50vh]' : 'py-10',
        className,
      )}
    >
      <Loader2 className="h-7 w-7 animate-spin text-[#4338CA]" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
