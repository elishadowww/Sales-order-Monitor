"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  updatedAt: Date | null;
};

/**
 * Small data-fetching hook for our own /api routes.
 * - Cancels the old request when the URL changes (no out-of-order results).
 * - Keeps the previous data while new data loads, so the page doesn't jump.
 * - `reload()` fetches the same URL again (used by "Try again" / "Refresh").
 * Pass `null` as the URL to skip fetching.
 */
export function useApi<T>(url: string | null) {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: url !== null,
    updatedAt: null,
  });
  const [nonce, setNonce] = useState(0);
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    // Clear old data when moving to a different resource (e.g. another order).
    const keepData =
      lastUrl.current !== null && sameResource(lastUrl.current, url);
    lastUrl.current = url;

    setState((s) => ({
      data: keepData ? s.data : null,
      error: null,
      loading: true,
      updatedAt: keepData ? s.updatedAt : null,
    }));

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error || `Request failed (${res.status}).`);
        }
        return body as T;
      })
      .then((data) =>
        setState({ data, error: null, loading: false, updatedAt: new Date() }),
      )
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof TypeError
            ? "You seem to be offline. Check your connection."
            : err instanceof Error
              ? err.message
              : "Something went wrong.";
        setState((s) => ({ ...s, error: message, loading: false }));
      });

    return () => controller.abort();
  }, [url, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}

// Same path = same resource (only the query string changed), so keep showing old rows.
function sameResource(a: string, b: string) {
  return a.split("?")[0] === b.split("?")[0];
}
