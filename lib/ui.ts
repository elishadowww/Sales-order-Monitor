// Shared class recipes (the "design system" in code).
// Use these instead of writing button / input / card styles by hand.

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600";

const buttonBase = `inline-flex items-center justify-center gap-1.5 rounded-control text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

export const ui = {
  focusRing,

  // Main call to action. Use at most one per view.
  buttonPrimary: `${buttonBase} h-9 bg-accent-600 px-4 text-white hover:bg-accent-700`,
  // Normal actions.
  buttonSecondary: `${buttonBase} h-9 border border-slate-300 bg-white px-3 text-slate-700 hover:bg-slate-50`,
  // Small secondary button (panel toolbars).
  buttonSmall: `${buttonBase} h-8 border border-slate-300 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50`,
  // Icon-only, no border.
  buttonIcon: `${buttonBase} h-9 w-9 text-slate-600 hover:bg-slate-100 hover:text-slate-900`,
  // Text link style.
  link: `rounded-sm text-sm font-medium text-accent-700 hover:underline underline-offset-2 ${focusRing}`,

  field:
    "h-10 w-full rounded-control border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-600/20",

  card: "rounded-card border border-slate-200 bg-white",

  // Text roles
  label: "text-sm text-slate-600",
  meta: "text-xs text-slate-600",
};
