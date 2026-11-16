import "server-only";

// Server-only helper for calling the HSSB mock API.
// The API key is read from an environment variable and never sent to the browser.

const DEFAULT_BASE = "https://hiring.harrisons.my/api/mock/sales-orders";

export class UpstreamError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function config() {
  const key = process.env.HSSB_API_KEY;
  if (!key) {
    throw new UpstreamError(
      "Server is missing HSSB_API_KEY. Add it to .env.local (or Vercel env vars).",
      500,
    );
  }
  return { key, base: process.env.HSSB_API_BASE || DEFAULT_BASE };
}

type FetchOptions = {
  // Seconds to cache the response on the server. 0 = always fresh.
  revalidate?: number;
};

/**
 * Calls the mock API. `path` is appended to the base URL, e.g. "" , "/meta", "/SO-MOCK-00001".
 */
export async function hssbFetch<T>(
  path: string,
  params?: URLSearchParams,
  { revalidate = 0 }: FetchOptions = {},
): Promise<T> {
  const { key, base } = config();
  const url = `${base}${path}${params && params.toString() ? `?${params}` : ""}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "x-assessment-key": key, accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      ...(revalidate > 0
        ? { next: { revalidate } }
        : { cache: "no-store" as const }),
    });
  } catch {
    throw new UpstreamError("Could not reach the sales order service.", 502);
  }

  if (!res.ok) {
    if (res.status === 404) throw new UpstreamError("Order not found.", 404);
    if (res.status === 401 || res.status === 403) {
      throw new UpstreamError("The server's API key was rejected.", 502);
    }
    throw new UpstreamError(
      `Sales order service returned an error (${res.status}).`,
      502,
    );
  }

  return (await res.json()) as T;
}

/** Turns any thrown error into a JSON error response. */
export function errorResponse(err: unknown) {
  if (err instanceof UpstreamError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Unexpected server error." }, { status: 500 });
}
