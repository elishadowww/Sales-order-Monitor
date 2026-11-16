import { statusStyle } from "@/lib/format";

// The dot matches the chart colour for that status; the word carries the meaning.
export default function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${s.badge}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
