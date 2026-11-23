import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18181B]/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kodera-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6">
          <div>
            <h2 id="kodera-modal-title" className="font-display text-lg font-bold text-[#18181B]">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-[#18181B]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
