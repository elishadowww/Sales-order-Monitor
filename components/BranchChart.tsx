"use client";

import { useRef, useState } from "react";
import {
  STATUS_ORDER,
  formatCount,
  formatRM,
  formatRMCompact,
  formatTime,
  statusStyle,
} from "@/lib/format";
import type { BranchSummaryResponse } from "@/lib/types";
import { focusRing, ui } from "@/lib/ui";
import { useDialog } from "@/lib/useDialog";
import Icon from "./Icon";
import { ErrorState, Skeleton } from "./States";

export type Metric = "value" | "count";

type ChartProps = {
  data: BranchSummaryResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  activeSite: string;
  activeStatus: string;
  onSelect: (site: string, status: string | null) => void;
  metric: Metric;
  onMetric: (m: Metric) => void;
};

// Horizontal stacked bar chart: one bar per branch, split by status.
// Built with plain divs (no chart library) so every bar segment is a real,
// keyboard-focusable button that filters the order list.
//
// Used in two places:
//  - the compact side panel (<BranchChartPanel>) with an expand button
//  - the larger pop-up window (<BranchChartModal>)

const title = (m: Metric) =>
  m === "value" ? "Order value by branch" : "Order count by branch";

export function BranchChartPanel(props: ChartProps & { onExpand: () => void }) {
  return (
    <section
      aria-labelledby="branch-chart-title"
      className={`${ui.card} flex min-h-0 flex-col p-4`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="branch-chart-title"
          className="text-base font-semibold text-slate-900"
        >
          {title(props.metric)}
        </h2>
        <button
          type="button"
          onClick={props.onExpand}
          aria-label="Open chart in a larger window"
          title="Open in a larger window"
          className={`${ui.buttonIcon} -mr-1.5 h-8 w-8`}
        >
          <Icon name="expand" />
        </button>
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        <ChartBody {...props} size="compact" />
      </div>
    </section>
  );
}

export function BranchChartModal(props: ChartProps & { onClose: () => void }) {
  const { onClose, onSelect } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialog(panelRef, closeRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* rounded 16px with 20px padding: inner items use 8px radius, not 16px. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-modal-title"
        className="animate-pop-in relative flex max-h-full w-full max-w-3xl flex-col rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="chart-modal-title"
            className="text-lg font-semibold text-slate-900"
          >
            {title(props.metric)}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close chart"
            className={`${ui.buttonIcon} -mr-2`}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="mt-4 overflow-y-auto">
          <ChartBody
            {...props}
            size="large"
            onSelect={(site, status) => {
              onSelect(site, status);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ChartBody({
  data,
  loading,
  error,
  onRetry,
  activeSite,
  activeStatus,
  onSelect,
  metric,
  onMetric,
  size,
}: ChartProps & { size: "compact" | "large" }) {
  const [hover, setHover] = useState<string | null>(null);
  const large = size === "large";

  const branches = data
    ? [...data.branches].sort((a, b) =>
        metric === "value"
          ? b.totalValue - a.totalValue
          : b.totalCount - a.totalCount,
      )
    : [];
  const max = Math.max(
    1,
    ...branches.map((b) => (metric === "value" ? b.totalValue : b.totalCount)),
  );
  const fmt = (n: number) =>
    metric === "value" ? formatRMCompact(n) : formatCount(n);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ul
          className={`flex flex-wrap gap-x-3 gap-y-1 text-slate-600 ${large ? "text-sm" : "text-xs"}`}
        >
          {STATUS_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span
                className={`size-2.5 rounded-sm ${statusStyle(s).bar}`}
                aria-hidden="true"
              />
              {statusStyle(s).label}
            </li>
          ))}
        </ul>
        {/* Segmented control: outer 8px radius, 2px padding, so inner 6px. */}
        <div
          role="radiogroup"
          aria-label="Chart measure"
          className="inline-flex rounded-control bg-slate-100 p-0.5 text-xs"
        >
          {(["value", "count"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={metric === m}
              onClick={() => onMetric(m)}
              className={`rounded-inner px-2.5 py-1 font-medium transition-colors ${focusRing} ${
                metric === m
                  ? "bg-white text-slate-900 ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {m === "value" ? "Value" : "Count"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        {error && !data ? (
          <ErrorState
            compact
            title="Couldn't load branch totals"
            message={error}
            onRetry={onRetry}
          />
        ) : !data ? (
          <div className="space-y-2" role="status" aria-label="Loading chart">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-10" />
                <Skeleton className={`flex-1 ${large ? "h-8" : "h-5"}`} />
                <Skeleton className="h-3.5 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <ul
            className={`${large ? "space-y-2.5" : "space-y-1.5"} transition-opacity ${loading ? "opacity-60" : ""}`}
          >
            {branches.map((b) => {
              const total = metric === "value" ? b.totalValue : b.totalCount;
              const faded = activeSite !== "" && activeSite !== b.site;
              return (
                <li key={b.site} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(b.site, null)}
                    aria-label={`Show all orders for branch ${b.site}`}
                    aria-pressed={activeSite === b.site && !activeStatus}
                    className={`shrink-0 rounded-sm text-left font-medium tabular-nums hover:text-accent-700 ${focusRing} ${
                      large ? "w-16 text-sm" : "w-12 text-xs"
                    } ${activeSite === b.site ? "text-accent-700" : "text-slate-700"}`}
                  >
                    {b.site}
                  </button>
                  <div className={`flex-1 ${large ? "h-8" : "h-5"}`}>
                    {/* Width animates when switching Value / Count. */}
                    <div
                      className={`flex h-full gap-px overflow-hidden rounded-sm transition-[width,opacity] duration-300 ease-out ${faded ? "opacity-35" : ""}`}
                      style={{ width: `${(total / max) * 100}%` }}
                    >
                      {STATUS_ORDER.map((status) => {
                        const cell = b.byStatus[status];
                        if (!cell) return null;
                        const part =
                          metric === "value" ? cell.value : cell.count;
                        const id = `${b.site}|${status}`;
                        const selected =
                          activeSite === b.site &&
                          (activeStatus === status ||
                            (activeStatus === "Completed" &&
                              (status === "Invoiced" ||
                                status === "Delivered")));
                        const label = `${b.site}, ${statusStyle(status).label}: ${formatCount(cell.count)} orders, ${formatRM(cell.value)}`;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => onSelect(b.site, status)}
                            onMouseEnter={() => setHover(id)}
                            onMouseLeave={() => setHover(null)}
                            onFocus={() => setHover(id)}
                            onBlur={() => setHover(null)}
                            aria-label={`${label}. Show these orders.`}
                            aria-pressed={selected}
                            className={`h-full min-w-1 ${statusStyle(status).bar} transition-[flex-grow,filter] duration-300 hover:brightness-90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-900 ${
                              selected
                                ? "outline-2 -outline-offset-2 outline-slate-900"
                                : ""
                            }`}
                            style={{ flexGrow: part, flexBasis: 0 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-right tabular-nums text-slate-700 ${large ? "w-20 text-sm" : "w-14 text-xs"}`}
                  >
                    {fmt(total)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {data && (
        <>
          {/* Detail line: hovered segment, otherwise the top branch. */}
          <p
            className={`mt-3 tabular-nums text-slate-600 ${large ? "min-h-10 text-sm" : "min-h-8 text-xs"}`}
            aria-live="polite"
          >
            {hover ? (
              <HoverDetail id={hover} data={data} />
            ) : (
              <TopBranch data={data} metric={metric} />
            )}
          </p>
          <p className="mt-1 text-xs tabular-nums text-slate-500">
            As of {formatTime(new Date(data.generatedAt))} · updates every 5 min
          </p>
        </>
      )}
    </div>
  );
}

function HoverDetail({
  id,
  data,
}: {
  id: string;
  data: BranchSummaryResponse;
}) {
  const [site, status] = id.split("|");
  const branch = data.branches.find((b) => b.site === site);
  const cell = branch?.byStatus[status];
  if (!branch || !cell) return null;
  const share = branch.totalValue
    ? Math.round((cell.value / branch.totalValue) * 100)
    : 0;
  return (
    <span className="animate-fade-in">
      <strong className="font-semibold text-slate-900">{site}</strong> ·{" "}
      {statusStyle(status).label}: {formatCount(cell.count)} orders,{" "}
      {formatRM(cell.value)} ({share}% of branch value)
    </span>
  );
}

function TopBranch({
  data,
  metric,
}: {
  data: BranchSummaryResponse;
  metric: Metric;
}) {
  const top = [...data.branches].sort((a, b) =>
    metric === "value"
      ? b.totalValue - a.totalValue
      : b.totalCount - a.totalCount,
  )[0];
  if (!top) return null;
  // In the mock data every branch has 150 orders, so "highest" would be misleading.
  if (
    metric === "count" &&
    data.branches.every((b) => b.totalCount === top.totalCount)
  ) {
    return <span>Every branch has {formatCount(top.totalCount)} orders</span>;
  }
  return (
    <span>
      Highest:{" "}
      <strong className="font-semibold text-slate-900">{top.site}</strong> with{" "}
      {metric === "value"
        ? formatRM(top.totalValue)
        : `${formatCount(top.totalCount)} orders`}
    </span>
  );
}
