"use client";

import { formatCount, formatRM } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";
import { focusRing } from "@/lib/ui";
import { Skeleton } from "./States";

type Props = {
  summary: OrderSummary | null;
  branchCount: number | null;
  activeStatus: string;
  onSelectStatus: (status: string | null) => void;
};

const cardBase =
  "rounded-card border bg-white px-4 py-3 text-left transition-colors";
const activeCard = "border-accent-600 ring-1 ring-accent-600";
const idleCard = "border-slate-200";

// Company-wide KPI cards. Clicking a card filters the order list by that status.
export default function KpiCards({
  summary,
  branchCount,
  activeStatus,
  onSelectStatus,
}: Props) {
  if (!summary) {
    return (
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        role="status"
        aria-label="Loading totals"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${cardBase} ${idleCard}`}>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2 h-6 w-20" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const total = summary.total_orders || 1;
  const pct = (n: number) => `${Math.round((n / total) * 100)}% of orders`;
  const completed = summary.invoiced_orders + summary.delivered_orders;
  const avg = summary.total_order_value / total;

  return (
    <div className="animate-fade-in grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <CardButton
        label="Total orders"
        value={formatCount(summary.total_orders)}
        hint={branchCount ? `Across ${branchCount} branches` : " "}
        active={activeStatus === ""}
        dot="bg-slate-400"
        onClick={() => onSelectStatus(null)}
      />
      <CardButton
        label="Open"
        value={formatCount(summary.open_orders)}
        hint={pct(summary.open_orders)}
        active={activeStatus === "Open order"}
        dot="bg-amber-400"
        onClick={() => onSelectStatus("Open order")}
      />

      {/* Completed = Invoiced + Delivered. The API can only filter one status,
          so our /api/orders route merges the two (see lib/completed.ts). */}
      <CardButton
        label="Completed"
        value={formatCount(completed)}
        hint={`${formatCount(summary.invoiced_orders)} invoiced, ${formatCount(summary.delivered_orders)} delivered`}
        active={activeStatus === "Completed"}
        dot="bg-emerald-500"
        onClick={() => onSelectStatus("Completed")}
      />

      <CardButton
        label="Cancelled"
        value={formatCount(summary.cancelled_orders)}
        hint={pct(summary.cancelled_orders)}
        active={activeStatus === "Cancelled"}
        dot="bg-rose-400"
        onClick={() => onSelectStatus("Cancelled")}
      />

      {/* The key number: kept dark on purpose so it stands out. */}
      <div className="col-span-2 rounded-card bg-slate-900 px-4 py-3 text-white sm:col-span-1">
        <p className="text-sm text-slate-300">Total order value</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums">
          {formatRM(summary.total_order_value)}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-slate-300">
          Avg {formatRM(avg)} per order
        </p>
      </div>
    </div>
  );
}

function CardButton({
  label,
  value,
  hint,
  active,
  dot,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  active: boolean;
  dot: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${cardBase} ${focusRing} ${active ? activeCard : `${idleCard} hover:border-slate-400`}`}
    >
      <span className="flex items-center gap-2 text-sm text-slate-600">
        <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </span>
      <span className="mt-0.5 block text-xl font-semibold tabular-nums text-slate-900">
        {value}
      </span>
      <span className="mt-0.5 block text-xs tabular-nums text-slate-600">
        {hint}
      </span>
    </button>
  );
}
