// Shapes of the data returned by the HSSB mock sales-orders API.
// Field names match the API exactly (checked against /meta and a live list call).

export type SalesStatus = "Open order" | "Invoiced" | "Delivered" | "Cancelled";

export interface SalesOrder {
  SalesId: string;
  SalesName: string;
  CustAccount: string;
  InventSiteId: string;
  DOT_ItemGroupId: string | null;
  SalesGroup: string | null;
  SalesStatus: SalesStatus | string;
  DocumentStatus: string | null;
  DOT_ValidationStatus: string | null;
  DOT_ShowOrderStatus: string | null;
  ShippingDateRequested: string | null;
  CreatedDateTime1: string;
  ModifiedDateTime1: string | null;
  HAR_TotalSOAmount: number;
  HAR_InvoicedAmount: number | null;
  HAR_BalanceAmount: number | null;
  SalesTaker: string | null;
  CustomerRef: string | null;
  SalesDistrictDescription: string | null;
  SalesType: string | null;
  DOT_SONotes: string | null;
  DOT_SFANotes: string | null;
  PurchOrderFormNum: string | null;
  ReleaseStatus: string | null;
  MCROrderStopped: string | null;
  HAR_SalesDeliveryDistrictId: string | null;
  HAR_DeliveryDistrictDescription: string | null;
}

// Note: the API's summary is always company-wide. Only `filtered_orders`
// changes when filters are applied.
export interface OrderSummary {
  total_orders: number;
  filtered_orders: number;
  open_orders: number;
  invoiced_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_order_value: number;
}

export interface OrderListResponse {
  summary: OrderSummary;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "asc" | "desc";
  data: SalesOrder[];
}

export interface Facet {
  value: string;
  count: number;
}

export interface MetaResponse {
  facets: {
    statuses: Facet[];
    sites: Facet[];
  };
}

// Built by our own /api/branch-summary route (not by the mock API).
export interface BranchStatusCell {
  count: number;
  value: number;
}

export interface BranchSummaryRow {
  site: string;
  totalCount: number;
  totalValue: number;
  byStatus: Record<string, BranchStatusCell>;
}

export interface BranchSummaryResponse {
  generatedAt: string;
  orderCount: number;
  branches: BranchSummaryRow[];
}

export interface ApiErrorBody {
  error: string;
}
