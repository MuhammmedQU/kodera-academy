import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#4338CA] text-white hover:bg-[#3730A3] shadow-xs disabled:bg-[#4338CA]/50',
  secondary:
    'bg-[#18181B] text-white hover:bg-[#27272A] shadow-xs disabled:bg-[#18181B]/50',
  accent:
    'bg-[#F59E0B] text-[#18181B] hover:bg-[#D97706] shadow-xs disabled:bg-[#F59E0B]/50',
  outline:
    'border border-zinc-300 bg-white text-[#18181B] hover:bg-zinc-50 hover:border-zinc-400 disabled:opacity-50',
  ghost:
    'bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-[#18181B] disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-xs disabled:bg-red-600/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4.5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA] disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
