import { errorResponse, hssbFetch } from "@/lib/hssb";
import type { MetaResponse } from "@/lib/types";

// GET /api/meta -> list of statuses and branches (sites) for the filter dropdowns.
// These rarely change, so the server caches them for 1 hour.

export async function GET() {
  try {
    const meta = await hssbFetch<MetaResponse>("/meta", undefined, {
      revalidate: 3600,
    });
    return Response.json({
      statuses: meta.facets?.statuses ?? [],
      sites: meta.facets?.sites ?? [],
    });
  } catch (err) {
    return errorResponse(err);
  }
}
