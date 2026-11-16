"use client";

import { useEffect, useState } from "react";
import { statusStyle } from "@/lib/format";
import type { Facet } from "@/lib/types";
import { focusRing, ui } from "@/lib/ui";
import Icon from "./Icon";

export const SORT_OPTIONS = {
  newest: { label: "Newest first", sort: "CreatedDateTime1", order: "desc" },
  oldest: { label: "Oldest first", sort: "CreatedDateTime1", order: "asc" },
  amount_desc: {
    label: "Highest amount",
    sort: "HAR_TotalSOAmount",
    order: "desc",
  },
  amount_asc: {
    label: "Lowest amount",
    sort: "HAR_TotalSOAmount",
    order: "asc",
  },
  order_no: { label: "Order number", sort: "SalesId", order: "asc" },
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

type Props = {
  q: string;
  site: string;
  status: string;
  sort: SortKey;
  sites: Facet[];
  statuses: Facet[];
  facetsLoading: boolean;
  onSearch: (q: string) => void;
  onSite: (site: string) => void;
  onStatus: (status: string) => void;
  onSort: (sort: SortKey) => void;
};

// Visible labels on phones (fields stack), screen-reader-only on desktop
// where the dropdown values already say what they are.
const fieldLabel = "mb-1 block text-xs font-medium text-slate-600 lg:sr-only";

export default function FilterBar(props: Props) {
  const { q, onSearch, facetsLoading } = props;
  const completedCount = props.statuses
    .filter((s) => s.value === "Invoiced" || s.value === "Delivered")
    .reduce((sum, s) => sum + s.count, 0);

  // Local text so typing feels instant; the URL (and API call) updates
  // 400ms after the user stops typing (debounce), or right away on Enter.
  const [text, setText] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    // URL changed from outside (e.g. "Clear filters"), so sync the input.
    setPrevQ(q);
    setText(q);
  }

  useEffect(() => {
    if (text.trim() === q) return;
    const t = setTimeout(() => onSearch(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text, q, onSearch]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(text.trim());
      }}
      className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="relative col-span-2 lg:col-span-1">
        <label htmlFor="order-search" className="sr-only">
          Search orders
        </label>
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500"
        />
        <input
          id="order-search"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Order no., customer, PO ref or sales taker"
          maxLength={100}
          autoComplete="off"
          className={`${ui.field} pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden`}
        />
        {text && (
          <button
            type="button"
            onClick={() => {
              setText("");
              onSearch("");
            }}
            aria-label="Clear search"
            className={`absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 text-slate-500 hover:text-slate-900 ${focusRing}`}
          >
            <Icon name="x" />
          </button>
        )}
      </div>

      <div>
        <label htmlFor="filter-site" className={fieldLabel}>
          Branch
        </label>
        <select
          id="filter-site"
          value={props.site}
          onChange={(e) => props.onSite(e.target.value)}
          className={ui.field}
        >
          <option value="">All branches</option>
          {facetsLoading && props.sites.length === 0 && (
            <option disabled>Loading branches…</option>
          )}
          {props.sites.map((s) => (
            <option key={s.value} value={s.value}>
              {s.value} ({s.count})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-status" className={fieldLabel}>
          Status
        </label>
        <select
          id="filter-status"
          value={props.status}
          onChange={(e) => props.onStatus(e.target.value)}
          className={ui.field}
        >
          <option value="">All statuses</option>
          {facetsLoading && props.statuses.length === 0 && (
            <option disabled>Loading statuses…</option>
          )}
          {props.statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {statusStyle(s.value).label} ({s.count})
            </option>
          ))}
          {completedCount > 0 && (
            <option value="Completed">Completed ({completedCount})</option>
          )}
        </select>
      </div>

      <div className="col-span-2 lg:col-span-1">
        <label htmlFor="sort" className={fieldLabel}>
          Sort by
        </label>
        <select
          id="sort"
          value={props.sort}
          onChange={(e) => props.onSort(e.target.value as SortKey)}
          className={ui.field}
        >
          {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
            <option key={key} value={key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
