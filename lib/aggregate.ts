import type { BranchSummaryRow, SalesOrder } from "./types";

/**
 * Groups orders by branch (InventSiteId) and status.
 * Returns one row per branch, sorted by total value (highest first).
 * Kept as a pure function so it is easy to test.
 */
export function aggregateByBranch(orders: SalesOrder[]): BranchSummaryRow[] {
  const rows = new Map<string, BranchSummaryRow>();

  for (const o of orders) {
    const site = o.InventSiteId || "Unknown";
    const status = o.SalesStatus || "Unknown";
    const amount = Number(o.HAR_TotalSOAmount) || 0;

    let row = rows.get(site);
    if (!row) {
      row = { site, totalCount: 0, totalValue: 0, byStatus: {} };
      rows.set(site, row);
    }
    row.totalCount += 1;
    row.totalValue += amount;

    const cell = (row.byStatus[status] ??= { count: 0, value: 0 });
    cell.count += 1;
    cell.value += amount;
  }

  // Round money to 2 decimal places to avoid float noise (e.g. 0.30000000004).
  const round = (n: number) => Math.round(n * 100) / 100;
  return [...rows.values()]
    .map((r) => ({
      ...r,
      totalValue: round(r.totalValue),
      byStatus: Object.fromEntries(
        Object.entries(r.byStatus).map(([k, v]) => [
          k,
          { count: v.count, value: round(v.value) },
        ]),
      ),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}
