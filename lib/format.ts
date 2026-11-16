// Formatting helpers + status styling shared by the UI.

const rm = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rmCompact = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const count = new Intl.NumberFormat("en-MY");

/** RM 1,234.50 (Intl gives "RM 1,234.50" for en-MY). */
export function formatRM(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return rm.format(value);
}

export function formatRMCompact(value: number) {
  return rmCompact.format(value);
}

export function formatCount(value: number) {
  return count.format(value);
}

// Show dates in Malaysia time (the API stores UTC).
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kuala_Lumpur",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kuala_Lumpur",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kuala_Lumpur",
});

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | null | undefined) {
  const d = toDate(value);
  return d ? dateFmt.format(d) : "—";
}

export function formatDateTime(value: string | null | undefined) {
  const d = toDate(value);
  return d ? dateTimeFmt.format(d) : "—";
}

export function formatTime(d: Date) {
  return timeFmt.format(d);
}

// Each status always uses the same colour across cards, chart, badges.
// The label is always shown too, so colour is never the only signal.
export const STATUS_ORDER = [
  "Open order",
  "Invoiced",
  "Delivered",
  "Cancelled",
];

export const STATUS_STYLE: Record<
  string,
  { label: string; badge: string; bar: string; dot: string }
> = {
  "Open order": {
    label: "Open",
    badge: "bg-amber-50 text-amber-800",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  Invoiced: {
    label: "Invoiced",
    badge: "bg-sky-50 text-sky-800",
    bar: "bg-sky-500",
    dot: "bg-sky-500",
  },
  Delivered: {
    label: "Delivered",
    badge: "bg-emerald-50 text-emerald-800",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  // Not an API status: Invoiced + Delivered (used for the filter, not for badges).
  Completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-800",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    label: "Cancelled",
    badge: "bg-rose-50 text-rose-800",
    bar: "bg-rose-400",
    dot: "bg-rose-400",
  },
};

const FALLBACK_STYLE = {
  label: "",
  badge: "bg-slate-100 text-slate-700",
  bar: "bg-slate-400",
  dot: "bg-slate-400",
};

export function statusStyle(status: string) {
  return STATUS_STYLE[status] ?? { ...FALLBACK_STYLE, label: status };
}
