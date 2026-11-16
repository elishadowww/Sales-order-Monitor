import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";
import { TableSkeleton } from "@/components/States";

// The dashboard reads filters from the URL (useSearchParams), so it is
// wrapped in Suspense. The fallback is shown for a moment on first load.
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl rounded-xl border border-slate-200 bg-white">
            <TableSkeleton rows={10} />
          </div>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
