# Sales Order Monitor

A web app for a sales team to keep track of sales orders across all branches. Submitted for the Harrisons Sabah Sdn Bhd IT Executive technical assessment.

- **Live app:** <add Vercel URL>
- **Data:** the HSSB assessment mock API only (read-only, fictional data)

<!-- Optional: add a screenshot of the live app here, e.g. ![Dashboard](docs/screenshot.png) -->

## Requirements checklist

| Requirement | Where it is |
|---|---|
| Dashboard: total, open, completed, cancelled, total value | KPI cards at the top. Each card also filters the list when clicked |
| Order listing: SalesId, customer, branch, date, status, amount | Orders table (cards on mobile), with a detail panel for each order |
| Search + filter by branch and status | Search box, branch and status dropdowns, sort, and filters from the chart |
| API integration, no hard-coded data | Every request goes through the server routes in `app/api/` to the mock API |
| Loading, empty and error states | Skeletons, a specific empty message with Clear filters, errors with Try again |
| Responsive layout | One-screen layout on desktop, stacked on tablet and phone |

## How I approached it

Before building, I called the API to see what the data actually looks like. Some of what I found changed the design:

- **The `summary` object is always company-wide.** Filtering only changes `filtered_orders`. So the KPI cards are labelled "Company-wide totals", and the list shows its own filtered count. Otherwise users might think the cards change with the filters.
- **Every branch has exactly 150 orders.** A chart of orders per branch would just be 8 equal bars, so I chart **order value** by branch instead, split by status. Clicking a bar filters the list to that branch and status.
- **The API filters one status at a time**, but "Completed" means Invoiced + Delivered. I tested comma lists, repeated parameters and `|`, and none of them worked. So my `/api/orders` route accepts `status=Completed`, fetches both statuses, merges and sorts them, and returns the requested page (`lib/completed.ts`). I found this when clicking the Completed card did nothing at first.
- **The single-order endpoint wraps the order in `{ data }`** and returns 404 for unknown IDs. The detail panel handles both.

UX decisions:

- **One screen on desktop.** KPIs on top, branch chart on the left, orders on the right. Only the table scrolls, and its header stays fixed. Each panel can be expanded: the chart opens bigger in a pop-up, and the orders can take the full width.
- **The list title says what you are looking at**, e.g. "Open orders in B20 · 1–25 of 60". I used this instead of filter chips, because the dropdowns already show the active filters.
- **Filters live in the URL**, so refresh, the back button and shared links all work. A link like `?status=Open%20order&site=B20&id=SO-MOCK-00001` opens straight to that order.
- **Order details open in a side panel**, so you never lose your place in the list. It has a full-screen sheet on mobile, closes with Esc and the back button, and keeps keyboard focus inside while open.
- **Consistent visual rules:** one accent colour (indigo, so it doesn't clash with the sky-blue "Invoiced" status), fixed status colours always shown with the word, tabular numbers, 4.5:1 text contrast, and animation only where it gives feedback. It also respects the OS "reduce motion" setting. Tokens are in `app/globals.css`, shared styles in `lib/ui.ts`, and icons in `components/Icon.tsx`.

## Architecture and API integration

```
Browser (React)
   │  fetch /api/...            no API key in the browser
   ▼
Next.js route handlers (server, on Vercel)            adds x-assessment-key
   ├─ /api/orders                 → GET /sales-orders?page&pageSize&status&site&q&sort&order
   │                                (status=Completed → two calls, merged)
   ├─ /api/orders/[id]            → GET /sales-orders/{SalesId}
   ├─ /api/meta        cached 1 h → GET /sales-orders/meta     (dropdown options)
   └─ /api/branch-summary  5 min  → GET list pages 1..12 in parallel, grouped by branch + status
```

- **Why a server proxy:** if the browser called the mock API directly, the key would be visible in DevTools. The key stays in a server environment variable (`HSSB_API_KEY`). The routes also only forward known parameters, and they validate them: page size 1–100, a whitelist of sort fields, a length limit on search text, and the order number format.
- **Branch chart data:** there's no per-branch endpoint, so `/api/branch-summary` reads all 1,200 orders on the server (12 calls of 100), groups them (`lib/aggregate.ts`) and sends only 8 rows to the browser. It's cached for 5 minutes, so the mock API isn't hit on every visit.
- **Client fetching** (`lib/useApi.ts`): it cancels the previous request when filters change, so a slow old response can't overwrite a newer one. It keeps the old rows on screen (dimmed) while the next page loads, and has a `reload()` for Refresh and Try again. Search waits 400 ms after typing stops.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, hosted on Vercel. There's no chart library: the chart is plain HTML, so every bar is a real, keyboard-focusable button.

```
app/api/            server routes (proxy, merge, aggregation)
components/         Dashboard (layout + URL state), KpiCards, BranchChart,
                    FilterBar, OrdersTable, Pagination, OrderDrawer, States
lib/                hssb.ts (server-only API client), aggregate.ts, completed.ts,
                    useApi.ts, useDialog.ts, format.ts (RM, Malaysia time), ui.ts
scripts/mock-api.mjs  local copy of the API's behaviour for offline testing
```

## Testing

- **API checks with the real key:** the list, `/meta`, a single order, an unknown ID (404) and no key (401), to confirm field names, statuses and the summary behaviour.
- **Numbers:** the KPI totals match the API summary (1,200 orders; 420 open, 360 invoiced, 300 delivered, 120 cancelled; RM 998,244.30). The 8 branch totals add up to the same overall value.
- **"Completed" merge:** compared against sorting the combined Invoiced + Delivered list by hand, for date, amount and order-number sorting. Checked with a branch filter and across pages.
- **UI, using Playwright scripts against `scripts/mock-api.mjs`:**
  - desktop (1366×768 and 1920×1080 fit with no page scroll), tablet and phone layouts
  - KPI and chart clicks filter the list
  - search, sort and pagination
  - the detail panel (Esc, back button, shared `?id=` link, unknown ID)
  - empty state, and a simulated API failure
  - no console errors
- **Manual:** clicked through the app against the real API (cards, chart, filters, detail panel, mobile view).
- `npm run lint` and `npm run build` (TypeScript) both pass.

## Limitations and what I'd do next

- The KPI cards don't follow the filters, because the API summary is company-wide. Filtered KPIs would need the same server-side aggregation as the chart.
- Chart data can be up to 5 minutes old (the time is shown on the chart).
- "Completed" makes up to about 7 upstream calls per request (cached for 60 s). That's fine for 1,200 rows. With real data, I'd ask for a multi-status filter in the API.
- No login, since the data is fictional. A real version would need company sign-in.
- The Playwright checks aren't committed as a test suite yet. That and unit tests for `aggregate.ts` and `completed.ts` would be next.
- No CSV export.

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local     # put the assessment key in HSSB_API_KEY
npm run dev                    # http://localhost:3000
```

To work offline against the local stand-in API:

```bash
npm run mock                   # starts on port 4010
HSSB_API_BASE=http://127.0.0.1:4010/api/mock/sales-orders npm run dev
```

**Deploy:** import the repo in Vercel, add `HSSB_API_KEY` as an environment variable, and deploy.

## AI-use disclosure

<!-- Check every line below is true before submitting. Remove anything you didn't do. -->

I used **Claude (Anthropic)** as a pair programmer for this assessment.

- **My part:**
  - deciding what to build and how it should work for a sales team: the HCI-focused flow, clickable KPIs, adding a branch chart, the one-screen two-column layout with expandable panels, and a list of 20 design rules the UI had to follow
  - reviewing each version in the browser and asking for changes
  - finding issues by using the app (for example, the Completed card not filtering)
- **Claude's part:** it explored the API with me, wrote most of the code from those decisions, and ran the automated browser checks.
- **What I verified:**
  - ran the app locally against the real API and went through the features listed under Testing
  - checked the totals against the API summary
  - read through the code so I can explain the main parts: the server proxy and key handling, the branch aggregation, the Completed merge, URL-based filters, and the loading and error handling
