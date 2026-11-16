import { aggregateByBranch } from "@/lib/aggregate";
import { errorResponse, hssbFetch } from "@/lib/hssb";
import type { BranchSummaryResponse, OrderListResponse } from "@/lib/types";

// GET /api/branch-summary -> order value and count per branch, split by status.
//
// Why this route exists: the mock API's `summary` is always company-wide,
// so there is no way to ask it for "value per branch". Instead, this route
// pages through the list endpoint (100 per page, pages fetched in parallel),
// then adds the numbers up on the server.
//
// Each upstream page is cached for 5 minutes, so the mock API is called at
// most ~12 times every 5 minutes, not on every visit.

const PAGE_SIZE = 100;
const CACHE_SECONDS = 300;
const MAX_PAGES = 50; // safety limit (5,000 orders)

function pageParams(page: number) {
  return new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    sort: "SalesId",
    order: "asc",
  });
}

export async function GET() {
  try {
    const first = await hssbFetch<OrderListResponse>("", pageParams(1), {
      revalidate: CACHE_SECONDS,
    });

    const totalPages = Math.min(first.totalPages, MAX_PAGES);
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        hssbFetch<OrderListResponse>("", pageParams(i + 2), {
          revalidate: CACHE_SECONDS,
        }),
      ),
    );

    const orders = [first, ...rest].flatMap((p) => p.data);

    const body: BranchSummaryResponse = {
      generatedAt: new Date().toISOString(),
      orderCount: orders.length,
      branches: aggregateByBranch(orders),
    };

    return Response.json(body, {
      headers: {
        "Cache-Control": `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=60`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
