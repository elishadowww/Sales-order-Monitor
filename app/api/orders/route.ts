import type { NextRequest } from "next/server";
import { COMPLETED, COMPLETED_STATUSES, compareOrders } from "@/lib/completed";
import { errorResponse, hssbFetch } from "@/lib/hssb";
import type { OrderListResponse, SalesOrder } from "@/lib/types";

// GET /api/orders?page=&pageSize=&status=&site=&q=&sort=&order=
// Proxies the mock API list endpoint so the API key stays on the server.
// Only known query params are forwarded, and each is validated.
//
// Extra: status=Completed is our own "virtual" status = Invoiced + Delivered.
// The mock API can only filter ONE status at a time, so for Completed this
// route fetches both statuses, merges and sorts them, then returns one page.

const SORT_FIELDS = new Set([
  "SalesId",
  "CreatedDateTime1",
  "HAR_TotalSOAmount",
  "SalesStatus",
  "InventSiteId",
]);

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams;
  const params = new URLSearchParams();

  const rawPage = Number.parseInt(input.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  params.set("page", String(page));

  const rawSize = Number.parseInt(input.get("pageSize") ?? "25", 10);
  const pageSize = Number.isFinite(rawSize)
    ? Math.min(Math.max(rawSize, 1), 100)
    : 25;
  params.set("pageSize", String(pageSize));

  const status = input.get("status")?.trim().slice(0, 50) ?? "";
  if (status) params.set("status", status);

  const site = input.get("site")?.trim();
  if (site) params.set("site", site.slice(0, 20));

  const q = input.get("q")?.trim();
  if (q) params.set("q", q.slice(0, 100));

  let sort = "SalesId";
  let order: "asc" | "desc" = "asc";
  const sortParam = input.get("sort");
  if (sortParam && SORT_FIELDS.has(sortParam)) {
    sort = sortParam;
    order = input.get("order") === "desc" ? "desc" : "asc";
    params.set("sort", sort);
    params.set("order", order);
  }

  try {
    if (status.toLowerCase() === COMPLETED.toLowerCase()) {
      return Response.json(
        await fetchCompleted(params, page, pageSize, sort, order),
        {
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const data = await hssbFetch<OrderListResponse>("", params);
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Builds one page of "Completed" orders (Invoiced + Delivered).
 * Fetches every matching order for both statuses (100 per call, in parallel,
 * cached for 60s), merges them, sorts them the same way the API does, and
 * slices out the requested page.
 */
async function fetchCompleted(
  base: URLSearchParams,
  page: number,
  pageSize: number,
  sort: string,
  order: "asc" | "desc",
): Promise<OrderListResponse> {
  const lists = await Promise.all(
    COMPLETED_STATUSES.map((s) => fetchAllForStatus(base, s)),
  );
  const merged: SalesOrder[] = lists
    .flatMap((l) => l.data)
    .sort((a, b) => compareOrders(a, b, sort, order));

  const total = merged.length;
  return {
    summary: { ...lists[0].summary, filtered_orders: total },
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    sort,
    order,
    data: merged.slice((page - 1) * pageSize, page * pageSize),
  };
}

async function fetchAllForStatus(base: URLSearchParams, status: string) {
  const make = (p: number) => {
    const params = new URLSearchParams(base);
    params.set("status", status);
    params.set("page", String(p));
    params.set("pageSize", "100");
    return params;
  };
  const first = await hssbFetch<OrderListResponse>("", make(1), {
    revalidate: 60,
  });
  const pages = Math.min(first.totalPages, 50);
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
      hssbFetch<OrderListResponse>("", make(i + 2), { revalidate: 60 }),
    ),
  );
  return {
    summary: first.summary,
    data: [first, ...rest].flatMap((r) => r.data),
  };
}
