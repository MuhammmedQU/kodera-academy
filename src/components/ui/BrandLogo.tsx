import { cn } from '@/lib/cn';

interface BrandLogoProps {
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function BrandLogo({
  name = 'Kodera',
  size = 'md',
  className,
  showText = true,
}: BrandLogoProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={cn(iconSize, 'shrink-0 rounded-xl shadow-xs')}
      >
        <rect width="64" height="64" rx="16" fill="#18181B" />
        <rect x="3" y="3" width="58" height="58" rx="13" stroke="#4338CA" strokeWidth="2.5" />
        <path d="M20 17V47" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" />
        <path
          d="M42 18L26 32L42 46"
          stroke="#6366F1"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="46" cy="32" r="4" fill="#F59E0B" />
      </svg>
      {showText && (
        <span className={cn('font-display font-extrabold tracking-tight text-[#18181B]', textSize)}>
          {name}
        </span>
      )}
    </span>
  );
}
