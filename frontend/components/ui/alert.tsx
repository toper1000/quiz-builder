import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { XMarkIcon } from './icons';

interface AlertProps {
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ title, children, onDismiss, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm break-words">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 rounded-md p-1 text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <XMarkIcon className="size-5" />
        </button>
      )}
    </div>
  );
}
