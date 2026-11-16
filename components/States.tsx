// Shared loading / empty / error UI.
import { ui } from "@/lib/ui";
import Icon from "./Icon";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-control bg-slate-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading orders"
      className="divide-y divide-slate-100"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-12 md:block" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
      <span className="sr-only">Loading orders…</span>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="animate-rise-in flex flex-col items-center px-6 py-14 text-center">
      <Icon name="inbox" size={24} className="text-slate-500" />
      <h3 className="mt-3 max-w-md text-base font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`${ui.buttonPrimary} mt-5`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
  compact = false,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`animate-rise-in flex flex-col items-center text-center ${compact ? "px-4 py-8" : "px-6 py-14"}`}
    >
      <Icon name="alert" size={24} className="text-rose-600" />
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={`${ui.buttonPrimary} mt-5`}
      >
        <Icon name="refresh" />
        Try again
      </button>
    </div>
  );
}
