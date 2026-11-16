"use client";

import { ui } from "@/lib/ui";
import Icon from "./Icon";

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
};

export const PAGE_SIZES = [25, 50, 100];

export default function Pagination({
  page,
  totalPages,
  pageSize,
  onPage,
  onPageSize,
}: Props) {
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-200 px-4 py-2.5 sm:flex-row"
    >
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <label htmlFor="page-size" className="whitespace-nowrap">
          Rows per page
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="h-9 rounded-control border border-slate-300 bg-white px-2 text-sm tabular-nums text-slate-900 focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20 focus:outline-none"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
          of {Math.max(totalPages, 1)}
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
