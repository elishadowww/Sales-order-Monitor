"use client";

import { type RefObject, useEffect } from "react";

/**
 * Shared behaviour for pop-up panels (order drawer, expanded chart):
 * - moves focus into the panel when it opens, and back when it closes
 * - Esc closes it
 * - Tab stays inside the panel (focus trap)
 * - the page behind it can't scroll
 */
export function useDialog(
  panelRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    initialFocusRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [panelRef, initialFocusRef, onClose]);
}
