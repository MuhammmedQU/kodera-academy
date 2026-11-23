import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#18181B]">
          {label}
          {props.required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#18181B] placeholder:text-zinc-400 transition-colors focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : 'border-zinc-300',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-xs text-zinc-500">
          {hint}
        </p>
      )}
    </div>
  );
});
