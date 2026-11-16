import type { SalesOrder } from "./types";

// "Completed" is not a real API status. It is our name for Invoiced + Delivered.
export const COMPLETED = "Completed";
export const COMPLETED_STATUSES = ["Invoiced", "Delivered"] as const;

/**
 * Sorts orders the same way the API does: by the chosen field, then by
 * order number (ascending) for ties.
 */
export function compareOrders(
  a: SalesOrder,
  b: SalesOrder,
  sort: string,
  order: "asc" | "desc",
) {
  const dir = order === "desc" ? -1 : 1;
  const av = a[sort as keyof SalesOrder];
  const bv = b[sort as keyof SalesOrder];
  let result = 0;
  if (typeof av === "number" && typeof bv === "number") result = av - bv;
  else result = String(av ?? "").localeCompare(String(bv ?? ""));
  // Ties: order number ascending, even when sorting descending
  // (this matches what the mock API does).
  if (result === 0) return a.SalesId.localeCompare(b.SalesId);
  return result * dir;
}
