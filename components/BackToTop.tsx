"use client";

import { useEffect, useState } from "react";
import { focusRing } from "@/lib/ui";
import Icon from "./Icon";

// Floating "back to top" button for phones and tablets, where the page scrolls.
// (On desktop the page fits one screen, so it is hidden with lg:hidden.)
// It only appears after the user has scrolled down a good amount.
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    // Move keyboard / screen-reader focus to the top as well.
    document.getElementById("page-title")?.focus({ preventScroll: true });
  }

  return (
    <button
      type="button"
      onClick={goToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex size-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-[opacity,transform] duration-200 hover:bg-slate-700 lg:hidden ${focusRing} ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <Icon name="arrowUp" size={20} />
    </button>
  );
}
