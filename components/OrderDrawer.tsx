"use client";

import { useRef, useState } from "react";
import { formatDate, formatDateTime, formatRM } from "@/lib/format";
import type { SalesOrder } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useDialog } from "@/lib/useDialog";
import { ui } from "@/lib/ui";
import Icon from "./Icon";
import { ErrorState, Skeleton } from "./States";
import StatusBadge from "./StatusBadge";

type Props = {
  id: string;
  // Row from the list (if we have it) so the drawer shows something instantly.
  preview: SalesOrder | null;
  onClose: () => void;
};

// Side panel with full order details. Full screen on phones.
// Accessibility: role="dialog", Esc closes, focus moves into the panel on
// open and back to the previously focused element on close.
export default function OrderDrawer({ id, preview, onClose }: Props) {
  const { data, error, loading, reload } = useApi<SalesOrder>(
    `/api/orders/${encodeURIComponent(id)}`,
  );
  const order = data ?? preview;
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog(panelRef, closeRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade-in absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="animate-slide-in relative flex h-full w-full flex-col bg-white shadow-xl sm:max-w-md"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="drawer-title"
              className="text-lg font-semibold tabular-nums text-slate-900"
            >
              <span className="sr-only">Sales order </span>
              {id}
            </h2>
            {order && (
              <div className="mt-1.5">
                <StatusBadge status={order.SalesStatus} />
              </div>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className={`${ui.buttonIcon} -mt-1 -mr-2`}
          >
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5" aria-busy={loading}>
          {error && !data ? (
            <ErrorState
              compact
              title={`Couldn't load order ${id}`}
              message={error}
              onRetry={reload}
            />
          ) : !order ? (
            <div className="space-y-4" role="status" aria-label="Loading order">
              <Skeleton className="h-24 w-full" />
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <OrderDetails order={order} complete={Boolean(data)} />
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetails({
  order,
  complete,
}: {
  order: SalesOrder;
  complete: boolean;
}) {
  const total = order.HAR_TotalSOAmount || 0;
  const invoiced = order.HAR_InvoicedAmount ?? 0;
  const balance = order.HAR_BalanceAmount ?? total - invoiced;
  const pct =
    total > 0 ? Math.min(100, Math.round((invoiced / total) * 100)) : 0;
  const notes = [order.DOT_SONotes, order.DOT_SFANotes].filter(
    Boolean,
  ) as string[];

  return (
    <div className="space-y-6">
      {/* Money */}
      <section className="rounded-card bg-slate-50 p-4">
        <p className="text-sm text-slate-600">Order amount</p>
        <p className="mt-0.5 text-2xl font-semibold text-slate-900 tabular-nums">
          {formatRM(total)}
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-xs tabular-nums text-slate-600">
            <span>Invoiced {formatRM(invoiced)}</span>
            <span>{pct}%</span>
          </div>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Amount invoiced"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent-600 transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs tabular-nums text-slate-600">
            Balance{" "}
            <span className="font-medium text-slate-900 tabular-nums">
              {formatRM(balance)}
            </span>
          </p>
        </div>
      </section>

      <CopyButton value={order.SalesId} />

      <Group title="Customer">
        <Row label="Name" value={order.SalesName} />
        <Row label="Account" value={order.CustAccount} />
        <Row label="Customer PO ref" value={order.CustomerRef} />
        <Row label="PO form no." value={order.PurchOrderFormNum} />
      </Group>

      <Group title="Order">
        <Row label="Branch (site)" value={order.InventSiteId} />
        <Row label="Sales taker" value={order.SalesTaker} />
        <Row label="Created" value={formatDateTime(order.CreatedDateTime1)} />
        <Row
          label="Last modified"
          value={formatDateTime(order.ModifiedDateTime1)}
        />
        <Row
          label="Requested ship date"
          value={formatDate(order.ShippingDateRequested)}
        />
        <Row label="Sales type" value={order.SalesType} />
        <Row label="Sales group" value={order.SalesGroup} />
        <Row label="Item group" value={order.DOT_ItemGroupId} />
      </Group>

      <Group title="Processing">
        <Row label="Document status" value={order.DocumentStatus} />
        <Row label="Validation" value={order.DOT_ValidationStatus} />
        <Row label="Release status" value={order.ReleaseStatus} />
        <Row label="Order stopped" value={order.MCROrderStopped} />
      </Group>

      <Group title="Delivery">
        <Row label="Sales district" value={order.SalesDistrictDescription} />
        <Row
          label="Delivery district"
          value={order.HAR_DeliveryDistrictDescription}
        />
        <Row
          label="Delivery district ID"
          value={order.HAR_SalesDeliveryDistrictId}
        />
      </Group>

      {complete && notes.length > 0 && (
        <Group title="Notes">
          {notes.map((n, i) => (
            <p
              key={i}
              className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              {n}
            </p>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 text-sm">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right font-medium break-words tabular-nums text-slate-900">
        {value || "—"}
      </dd>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard not available; ignore */
        }
      }}
      className={`${ui.buttonSecondary} ${copied ? "border-emerald-300 text-emerald-700" : ""}`}
    >
      <span key={String(copied)} className="animate-pop-in inline-flex">
        <Icon name={copied ? "check" : "copy"} />
      </span>
      <span aria-live="polite">{copied ? "Copied" : "Copy order no."}</span>
    </button>
  );
}
