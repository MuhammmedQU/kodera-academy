import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'outline'
  | 'outlineLight'
  | 'ghost'
  | 'danger';
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
  outlineLight:
    'border border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 disabled:opacity-50',
  ghost:
    'bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-[#18181B] disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-xs disabled:bg-red-600/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'min-h-10 px-4.5 py-2 text-sm rounded-xl gap-2',
  lg: 'min-h-12 px-6 py-2.5 text-base rounded-xl gap-2.5',
};

// eslint-disable-next-line react-refresh/only-export-components
export function buttonVariants(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const variant = options?.variant ?? 'primary';
  const size = options?.size ?? 'md';
  return cn(
    'inline-flex cursor-pointer items-center justify-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338CA] disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    options?.className,
  );
}

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
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Accessible link styled identically to Button (never nests <button> inside <a>). */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { className, variant = 'primary', size = 'md', children, ...props },
  ref,
) {
  return (
    <Link ref={ref} className={buttonVariants({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
});
