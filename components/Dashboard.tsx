"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCount, formatTime, statusStyle } from "@/lib/format";
import type {
  BranchSummaryResponse,
  Facet,
  OrderListResponse,
} from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { ui } from "@/lib/ui";
import { BranchChartModal, BranchChartPanel, type Metric } from "./BranchChart";
import Icon from "./Icon";
import FilterBar, { SORT_OPTIONS, type SortKey } from "./FilterBar";
import KpiCards from "./KpiCards";
import OrderDrawer from "./OrderDrawer";
import OrdersTable from "./OrdersTable";
import BackToTop from "./BackToTop";
import Pagination, { PAGE_SIZES } from "./Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "./States";

// All filter state lives in the URL (?q=&site=&status=&sort=&page=&size=&id=)
// so refresh keeps the view, the back button works, and links can be shared.

type Patch = Record<string, string | number | null>;

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const q = params.get("q") ?? "";
  const site = params.get("site") ?? "";
  const status = params.get("status") ?? "";
  const sortParam = params.get("sort") ?? "";
  const sort: SortKey =
    sortParam in SORT_OPTIONS ? (sortParam as SortKey) : "newest";
  const sizeParam = Number(params.get("size"));
  const pageSize = PAGE_SIZES.includes(sizeParam) ? sizeParam : 25;
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const selectedId = params.get("id");

  const listRef = useRef<HTMLElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Layout state (not in the URL; it's a personal view preference).
  const [chartOpen, setChartOpen] = useState(false); // chart pop-up window
  const [wideOrders, setWideOrders] = useState(false); // hide chart, orders full width
  const [metric, setMetric] = useState<Metric>("value");

  const setParams = useCallback(
    (patch: Patch, mode: "push" | "replace" = "push") => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "replace") router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [params, pathname, router],
  );

  // Changing any filter resets to page 1.
  const setFilter = useCallback(
    (patch: Patch, mode: "push" | "replace" = "push") =>
      setParams({ ...patch, page: null }, mode),
    [setParams],
  );

  const listUrl = useMemo(() => {
    const s = SORT_OPTIONS[sort];
    const p = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort: s.sort,
      order: s.order,
    });
    if (q) p.set("q", q);
    if (site) p.set("site", site);
    if (status) p.set("status", status);
    return `/api/orders?${p}`;
  }, [page, pageSize, q, site, sort, status]);

  const list = useApi<OrderListResponse>(listUrl);

  // New filter / page / sort: start the table from the top again.
  useEffect(() => {
    tableScrollRef.current?.scrollTo({ top: 0 });
  }, [listUrl]);
  const meta = useApi<{ statuses: Facet[]; sites: Facet[] }>("/api/meta");
  const branches = useApi<BranchSummaryResponse>("/api/branch-summary");

  const refreshAll = () => {
    list.reload();
    branches.reload();
    meta.reload();
  };

  const onSearch = useCallback(
    (value: string) => setFilter({ q: value }, "replace"),
    [setFilter],
  );
  // Opening the drawer adds a history entry, so the phone/browser back button
  // closes it. Closing it ourselves goes "back" too, so Back never re-opens it.
  const openedInApp = useRef(false);
  const openOrder = useCallback(
    (id: string) => {
      openedInApp.current = true;
      setParams({ id });
    },
    [setParams],
  );
  const closeOrder = useCallback(() => {
    if (openedInApp.current) {
      openedInApp.current = false;
      router.back();
    } else {
      // Opened from a shared link: just remove ?id from the URL.
      setParams({ id: null }, "replace");
    }
  }, [router, setParams]);

  const goToPage = (p: number) => {
    setParams({ page: p > 1 ? p : null });
    // Desktop: the table scrolls inside its panel, so reset that.
    // Mobile: the whole page scrolls, so bring the list into view.
    tableScrollRef.current?.scrollTo({ top: 0 });
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const sites = meta.data?.sites ?? [];
  const statuses = meta.data?.statuses ?? [];

  const data = list.data;
  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters = Boolean(q || site || status);
  const preview = orders.find((o) => o.SalesId === selectedId) ?? null;
  const clearFilters = () => setFilter({ q: null, site: null, status: null });

  // Specific headline that says what is being shown, e.g. "Open orders in B20".
  // (This replaces filter chips: the title already tells you the active filters.)
  const statusWord = status ? statusStyle(status).label : "";
  const listTitle = `${status ? `${statusWord} orders` : "All orders"}${site ? ` in ${site}` : ""}${
    q ? ` matching "${q}"` : ""
  }`;
  const emptyTitle = `No ${status ? `${statusWord.toLowerCase()} orders` : "orders"}${site ? ` in branch ${site}` : ""}${
    q ? ` match "${q}"` : ""
  }`;

  const pagerProps = {
    page,
    totalPages,
    pageSize,
    onPage: goToPage,
    onPageSize: (s: number) => setFilter({ size: s === 25 ? null : s }),
  };

  const chartProps = {
    data: branches.data,
    loading: branches.loading,
    error: branches.error,
    onRetry: branches.reload,
    activeSite: site,
    activeStatus: status,
    onSelect: (s: string, st: string | null) =>
      setFilter({ site: s, status: st }),
    metric,
    onMetric: setMetric,
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:h-dvh lg:min-h-[640px] lg:flex-col">
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            <h1
              id="page-title"
              tabIndex={-1}
              className="text-lg leading-tight font-semibold text-slate-900 outline-none"
            >
              Sales Order Monitor
            </h1>
            {/* Real context instead of a tagline. */}
            <p className="text-xs tabular-nums text-slate-600">
              {data && meta.data
                ? `${meta.data.sites.length} branches · ${formatCount(data.summary.total_orders)} orders · mock data`
                : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden text-xs tabular-nums text-slate-600 sm:inline"
              aria-live="polite"
            >
              {list.loading
                ? "Updating…"
                : list.updatedAt
                  ? `Updated ${formatTime(list.updatedAt)}`
                  : ""}
            </span>
            <button
              type="button"
              onClick={refreshAll}
              className={ui.buttonSecondary}
            >
              <Icon
                name="refresh"
                className={list.loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
        {/* Thin progress bar while the list is loading */}
        <div className="h-0.5 overflow-hidden" aria-hidden="true">
          {list.loading && (
            <div className="animate-progress h-full w-1/3 bg-accent-600" />
          )}
        </div>
      </header>

      {/* Desktop (lg+): everything fits in one screen. KPIs on top, then chart (left)
          and orders (right). Only the order table scrolls, inside its own panel.
          Mobile/tablet: sections stack and the page scrolls as normal. */}
      <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-4 sm:px-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-4 lg:space-y-0">
        <section aria-labelledby="kpi-title" className="shrink-0">
          <h2
            id="kpi-title"
            className="mb-2 text-sm font-semibold text-slate-700"
          >
            Company-wide totals
          </h2>
          {list.error && !data ? (
            <p
              role="alert"
              className="rounded-card border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              Couldn&apos;t load company totals. {list.error}
            </p>
          ) : (
            <KpiCards
              summary={data?.summary ?? null}
              branchCount={meta.data?.sites.length ?? null}
              activeStatus={status}
              onSelectStatus={(s) => setFilter({ status: s })}
            />
          )}
        </section>

        <div
          className={`space-y-6 lg:grid lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] lg:gap-4 lg:space-y-0 ${
            wideOrders
              ? "lg:grid-cols-1"
              : "lg:grid-cols-[minmax(280px,1fr)_minmax(0,2.6fr)]"
          }`}
        >
          {/* Left: chart */}
          <div
            className={`min-h-0 lg:flex lg:flex-col ${wideOrders ? "lg:hidden" : ""}`}
          >
            <BranchChartPanel
              {...chartProps}
              onExpand={() => setChartOpen(true)}
            />
          </div>

          {/* Right: orders (the main feature, so it gets the most space) */}
          <section
            ref={listRef}
            aria-labelledby="orders-title"
            className={`${ui.card} flex min-h-0 scroll-mt-20 flex-col overflow-hidden`}
          >
            <div className="shrink-0 space-y-3 p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2
                  id="orders-title"
                  className="text-base font-semibold text-slate-900"
                >
                  {listTitle}
                </h2>
                <p
                  className="text-sm tabular-nums text-slate-600"
                  aria-live="polite"
                >
                  {data
                    ? total > 0
                      ? `${formatCount(from)}–${formatCount(to)} of ${formatCount(total)}`
                      : "0 results"
                    : ""}
                </p>
                {/* Hidden when the empty state already shows a big "Clear filters" button. */}
                {hasFilters && total > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={ui.link}
                  >
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setWideOrders((w) => !w)}
                  aria-pressed={wideOrders}
                  aria-label={
                    wideOrders
                      ? "Show chart beside orders"
                      : "Expand orders to full width"
                  }
                  className={`${ui.buttonSmall} ml-auto self-center max-lg:hidden`}
                >
                  <Icon name={wideOrders ? "collapse" : "expand"} />
                  {wideOrders ? "Show chart" : "Expand"}
                </button>
              </div>
              <FilterBar
                q={q}
                site={site}
                status={status}
                sort={sort}
                sites={sites}
                statuses={statuses}
                facetsLoading={meta.loading}
                onSearch={onSearch}
                onSite={(v) => setFilter({ site: v })}
                onStatus={(v) => setFilter({ status: v })}
                onSort={(v) => setFilter({ sort: v === "newest" ? null : v })}
              />
              {/* Phones / tablets: page controls at the top too, so users don't
                  have to scroll to the bottom of a long list to change page. */}
              {data && total > 0 && (
                <div className="lg:hidden">
                  <Pagination
                    {...pagerProps}
                    variant="compact"
                    idPrefix="top"
                  />
                </div>
              )}
            </div>

            {/* On desktop this box scrolls; the table header stays fixed (sticky). */}
            <div
              ref={tableScrollRef}
              aria-busy={list.loading}
              className={`min-h-0 flex-1 overflow-auto border-t border-slate-200 transition-opacity ${
                list.loading && data ? "opacity-60" : ""
              }`}
            >
              {list.error && !data ? (
                <ErrorState
                  title="Couldn't load orders"
                  message={list.error}
                  onRetry={list.reload}
                />
              ) : !data ? (
                <TableSkeleton rows={8} />
              ) : orders.length === 0 ? (
                hasFilters ? (
                  <EmptyState
                    title={emptyTitle}
                    message="Try another search word, or clear the filters to see all orders."
                    actionLabel="Clear filters"
                    onAction={clearFilters}
                  />
                ) : page > 1 ? (
                  <EmptyState
                    title={`Page ${page} has no orders`}
                    message={`There are only ${totalPages} pages of results.`}
                    actionLabel="Go to page 1"
                    onAction={() => goToPage(1)}
                  />
                ) : (
                  <EmptyState
                    title="No sales orders yet"
                    message="New orders will appear here."
                  />
                )
              ) : (
                <>
                  {list.error && (
                    <div
                      role="alert"
                      className="flex items-center justify-between gap-3 bg-rose-50 px-4 py-2 text-sm text-rose-800"
                    >
                      <span>
                        Couldn&apos;t update the list. Showing the last loaded
                        results.
                      </span>
                      <button
                        type="button"
                        onClick={list.reload}
                        className="rounded-sm font-medium underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  <OrdersTable
                    orders={orders}
                    animationKey={`${listUrl}`}
                    selectedId={selectedId}
                    sort={sort}
                    onOpen={openOrder}
                    onSort={(v) =>
                      setFilter({ sort: v === "newest" ? null : v })
                    }
                  />
                </>
              )}
            </div>

            {data && total > 0 && (
              <div className="shrink-0">
                <Pagination {...pagerProps} />
              </div>
            )}
          </section>
        </div>

        <footer className="pb-20 text-center text-xs text-slate-600 lg:hidden">
          Fictional data from the HSSB assessment mock API. Read-only.
        </footer>
      </main>

      {chartOpen && (
        <BranchChartModal {...chartProps} onClose={() => setChartOpen(false)} />
      )}
      {selectedId && (
        <OrderDrawer id={selectedId} preview={preview} onClose={closeOrder} />
      )}
      <BackToTop />
    </div>
  );
}
