"use client";

import { formatDate, formatRM } from "@/lib/format";
import type { SalesOrder } from "@/lib/types";
import { focusRing } from "@/lib/ui";
import type { SortKey } from "./FilterBar";
import StatusBadge from "./StatusBadge";

type Props = {
  orders: SalesOrder[];
  // Changes when a new page/filter loads, so the rows fade in as feedback.
  animationKey: string;
  selectedId: string | null;
  sort: SortKey;
  onOpen: (id: string) => void;
  onSort: (sort: SortKey) => void;
};

type SortState = "ascending" | "descending" | "none";

// Desktop: a table. Mobile: a list of cards (a 6-column table is hard to read on a phone).
export default function OrdersTable({
  orders,
  animationKey,
  selectedId,
  sort,
  onOpen,
  onSort,
}: Props) {
  const dateSort: SortState =
    sort === "newest" ? "descending" : sort === "oldest" ? "ascending" : "none";
  const amountSort: SortState =
    sort === "amount_desc"
      ? "descending"
      : sort === "amount_asc"
        ? "ascending"
        : "none";

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Sales orders. Select an order number to see its details.
          </caption>
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-medium text-slate-600 shadow-[inset_0_-1px_0_var(--color-slate-200)]">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Order no.
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Customer
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Branch
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 font-medium"
                aria-sort={dateSort}
              >
                <SortHeader
                  label="Order date"
                  state={dateSort}
                  onClick={() =>
                    onSort(sort === "newest" ? "oldest" : "newest")
                  }
                />
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-right font-medium"
                aria-sort={amountSort}
              >
                <SortHeader
                  label="Amount"
                  state={amountSort}
                  onClick={() =>
                    onSort(
                      sort === "amount_desc" ? "amount_asc" : "amount_desc",
                    )
                  }
                />
              </th>
            </tr>
          </thead>
          <tbody
            key={animationKey}
            className="animate-fade-in divide-y divide-slate-100"
          >
            {orders.map((o) => {
              const selected = o.SalesId === selectedId;
              return (
                <tr
                  key={o.SalesId}
                  onClick={() => onOpen(o.SalesId)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    selected
                      ? "bg-accent-50 shadow-[inset_3px_0_0_var(--color-accent-600)]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(o.SalesId);
                      }}
                      className={`rounded-sm font-medium tabular-nums text-accent-700 hover:underline underline-offset-2 ${focusRing}`}
                    >
                      {o.SalesId}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div className="leading-tight font-medium text-slate-900">
                      {o.SalesName}
                    </div>
                    <div className="text-xs leading-tight tabular-nums text-slate-600">
                      {o.CustAccount}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-700">
                    {o.InventSiteId}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap tabular-nums text-slate-700">
                    {formatDate(o.CreatedDateTime1)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={o.SalesStatus} />
                  </td>
                  <td className="px-4 py-2 text-right font-medium whitespace-nowrap tabular-nums text-slate-900">
                    {formatRM(o.HAR_TotalSOAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul
        key={`m-${animationKey}`}
        className="animate-fade-in divide-y divide-slate-100 md:hidden"
      >
        {orders.map((o) => (
          <li key={o.SalesId}>
            <button
              type="button"
              onClick={() => onOpen(o.SalesId)}
              className={`block w-full px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-600 ${
                o.SalesId === selectedId ? "bg-accent-50" : "active:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium tabular-nums text-accent-700">
                  {o.SalesId}
                </span>
                <StatusBadge status={o.SalesStatus} />
              </div>
              <div className="mt-1 font-medium text-slate-900">
                {o.SalesName}
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="tabular-nums text-slate-600">
                  {o.InventSiteId} · {formatDate(o.CreatedDateTime1)}
                </span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatRM(o.HAR_TotalSOAmount)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// Arrow sits after the label in every column, so headers line up the same way.
function SortHeader({
  label,
  state,
  onClick,
}: {
  label: string;
  state: SortState;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-sm font-medium hover:text-slate-900 ${focusRing} ${
        state !== "none" ? "text-slate-900" : ""
      }`}
    >
      {label}
      <svg
        viewBox="0 0 16 16"
        width="12"
        height="12"
        fill="currentColor"
        aria-hidden="true"
        className="-mr-0.5"
      >
        <path
          d="M8 2.5 11.5 7h-7z"
          className={state === "ascending" ? "" : "opacity-30"}
        />
        <path
          d="M8 13.5 4.5 9h7z"
          className={state === "descending" ? "" : "opacity-30"}
        />
      </svg>
      <span className="sr-only">
        {state === "none" ? ", select to sort" : `, sorted ${state}`}
      </span>
    </button>
  );
}
