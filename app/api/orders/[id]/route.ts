import type { NextRequest } from "next/server";
import { errorResponse, hssbFetch } from "@/lib/hssb";
import type { SalesOrder } from "@/lib/types";

// GET /api/orders/SO-MOCK-00001 -> single order from the mock API.

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Basic input check: order numbers look like "SO-MOCK-00001".
  if (!/^[A-Za-z0-9-]{1,40}$/.test(id)) {
    return Response.json({ error: "Invalid order number." }, { status: 400 });
  }

  try {
    const order = await hssbFetch<SalesOrder | { data: SalesOrder }>(
      `/${encodeURIComponent(id)}`,
    );
    // Accept either a bare order or { data: order }.
    const data = "data" in order ? order.data : order;
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
