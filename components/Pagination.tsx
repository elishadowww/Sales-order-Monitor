"use client";

import { ui } from "@/lib/ui";
import Icon from "./Icon";

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  // "full": the bar under the table. "compact": small bar above the list on phones,
  // so users can change page without scrolling to the bottom.
  variant?: "full" | "compact";
  // Needed so two pagers on one page don't share the same id / label.
  idPrefix?: string;
};

export const PAGE_SIZES = [25, 50, 100];

const selectClass =
  "h-9 rounded-control border border-slate-300 bg-white px-2 text-sm tabular-nums text-slate-900 focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 focus:outline-none";

export default function Pagination({
  page,
  totalPages,
  pageSize,
  onPage,
  onPageSize,
  variant = "full",
  idPrefix = "bottom",
}: Props) {
  const pages = Math.max(totalPages, 1);
  const sizeId = `${idPrefix}-page-size`;

  const sizeSelect = (
    <select
      id={sizeId}
      value={pageSize}
      onChange={(e) => onPageSize(Number(e.target.value))}
      className={selectClass}
    >
      {PAGE_SIZES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );

  if (variant === "compact") {
    return (
      <nav
        aria-label="Pagination, top"
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label htmlFor={sizeId} className="whitespace-nowrap">
            Rows
          </label>
          {sizeSelect}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`${ui.buttonSecondary} w-9 px-0`}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <Icon name="chevronLeft" />
          </button>
          <span className="min-w-20 text-center text-sm tabular-nums text-slate-600">
            <strong className="font-semibold text-slate-900">{page}</strong> of{" "}
            {pages}
          </span>
          <button
            type="button"
            className={`${ui.buttonSecondary} w-9 px-0`}
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-200 px-4 py-2.5 max-lg:justify-center sm:flex-row"
    >
      {/* Hidden on phones/tablets: the top bar already has "Rows". */}
      <div className="flex items-center gap-2 text-sm text-slate-600 max-lg:hidden">
        <label htmlFor={sizeId} className="whitespace-nowrap">
          Rows per page
        </label>
        {sizeSelect}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={ui.buttonSecondary}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          <Icon name="arrowLeft" />
          Previous
        </button>
        <span
          className="min-w-24 text-center text-sm tabular-nums text-slate-600"
          aria-current="page"
        >
          Page <strong className="font-semibold text-slate-900">{page}</strong>{" "}
          of {pages}
        </span>
        <button
          type="button"
          className={ui.buttonSecondary}
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <Icon name="arrowRight" />
        </button>
      </div>
    </nav>
  );
}
