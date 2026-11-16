# Sales Order Monitor

A web app that helps a sales team monitor sales orders across branches.
Built for the Harrisons Sabah Sdn Bhd IT Executive technical assessment.

**Live app:** `<add your Vercel URL here>`

All data comes from the fictional HSSB assessment mock API. The app is read-only.

## Features

- **One-screen layout on desktop:** KPI cards across the top, the branch chart on the left (1/3) and the orders on the right (2/3). The page itself doesn't scroll. Only the order table scrolls inside its panel, and its header stays fixed. On tablets and phones the sections stack and the page scrolls normally.
- **Expand options:** the chart's expand button opens a larger pop-up window (clicking a bar there filters the orders and closes the window). The orders panel's **Expand** button hides the chart so the table uses the full width.

- **Company-wide KPI cards:** total orders, open, completed (invoiced + delivered), cancelled, and total order value in RM. Clicking a card filters the order list.
- **Order value by branch chart:** stacked bars split by status, with a Value / Count toggle. Clicking a bar filters the list by that branch and status.
- **Order list:** order no., customer, branch, order date, status and amount. It's a table on desktop and cards on mobile.
- **Search and filters:** debounced search (order no., customer, account, PO ref, sales taker), branch filter, status filter and sort. Active filters show as a list title that names the active filters (e.g. "Open orders in B20") and a Clear filters link.
- **Pagination:** Previous / Next, plus 25 / 50 / 100 rows per page.
- **Order detail drawer:** full order details, an invoiced-vs-balance progress bar, notes, and a copy button.
- **Shareable URLs:** every filter, the current page and the open order are kept in the URL (`?status=Open%20order&site=B20&id=SO-MOCK-00001`). Refresh, the back button and shared links all work.
- **Loading, empty and error states:** skeletons while loading, a "No orders match" message with a Clear filters button, and friendly errors with Try again.
- **Responsive and accessible:** keyboard-friendly (Esc closes the drawer, focus is trapped while it's open), visible focus rings, ARIA labels, and status shown as both colour and text. The app also respects the "reduce motion" setting.

## Design system

- **Tokens** are in `app/globals.css` (`@theme`). There's one indigo accent colour, and a radius scale (card 12px, control 8px, inner 6px) so nested corners follow "inner = outer − padding".
- **Shared class recipes** are in `lib/ui.ts` (primary, secondary and small buttons, inputs, cards, links, focus ring). There is at most one primary button per view.
- **Icons** come from one component (`components/Icon.tsx`) with the same stroke width everywhere.
- **Status colours** are fixed per status (open = amber, invoiced = sky, delivered = emerald, cancelled = rose) and always shown together with the word.
- All numbers use tabular figures, so columns line up. All body text meets 4.5:1 contrast. Headlines use `text-wrap: balance`.
- **Motion is only used for feedback:** row fade-in on new results, chart bars resizing when switching Value/Count, the drawer slide-in, the copy tick and the progress bar. It's turned off when the OS "reduce motion" setting is on.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- No database and no chart library. The chart is built from plain HTML elements, so every bar is a real button.
- Hosted on Vercel

## Run it locally

You need Node.js 20 or newer.

```bash
git clone <your-repo-url>
cd harrisons-sales-orders
npm install
cp .env.example .env.local     # then paste the assessment API key into .env.local
npm run dev
```

Open http://localhost:3000.

Other commands:

```bash
npm run build   # production build (also type-checks)
npm run start   # run the production build
npm run lint    # ESLint
```

## Deploy to Vercel

1. Push this repo to GitHub (public).
2. On vercel.com, click **Add New → Project** and import the repo.
3. Under **Environment Variables**, add `HSSB_API_KEY` with the assessment key.
4. Click **Deploy**.

## Architecture and API integration

```
Browser (React client components)
   │  fetch /api/...  (no API key in the browser)
   ▼
Next.js Route Handlers (server, on Vercel)          adds x-assessment-key header
   ├─ GET /api/orders            ─────────────────▶  GET /api/mock/sales-orders?page&pageSize&status&site&q&sort&order
   ├─ GET /api/orders/[id]       ─────────────────▶  GET /api/mock/sales-orders/{SalesId}
   ├─ GET /api/meta   (cached 1h) ────────────────▶  GET /api/mock/sales-orders/meta
   └─ GET /api/branch-summary (cached 5 min) ─────▶  GET list pages 1..N (100 per page, in parallel)
```

**Why a server proxy instead of calling the API from the browser?**
If the browser called the mock API directly, the API key would be visible in DevTools. The Next.js route handlers keep the key in a server-side environment variable (`HSSB_API_KEY`). They also only forward known query parameters, and they validate them (page ≥ 1, pageSize 1–100, a whitelist of sort fields, a max length on search text, and a pattern check on the order number).

**Things I found by testing the API, and how they shaped the design:**

1. **The `summary` object is always company-wide.** Filtering by branch or status only changes `filtered_orders`. So the KPI cards are labelled "Company-wide totals", and the "Showing 1–25 of 150" line uses the filtered total.
2. **There is no per-branch summary.** To draw "value by branch", `/api/branch-summary` reads all orders (12 pages of 100, fetched in parallel), then groups them by `InventSiteId` and `SalesStatus` on the server (`lib/aggregate.ts`). Each upstream page is cached for 5 minutes, so the mock API is called at most about 12 times every 5 minutes, not on every visit. The full dataset is never sent to the browser. It only receives 8 summary rows.
3. **Every branch has exactly 150 orders**, so a plain "orders per branch" chart would be 8 equal bars. The chart defaults to order value and splits each bar by status, which shows more. (In this mock data, branch values are close to each other, around RM 124k each. Real data would vary more.)
4. **The statuses are** `Open order`, `Invoiced`, `Delivered` and `Cancelled`. "Completed" = Invoiced + Delivered, but the API can only filter **one** status at a time (I tested comma lists, repeated params, `|` and `completed`). So `/api/orders` accepts our own virtual status `Completed`. It fetches every matching Invoiced and Delivered order (100 per call, in parallel, cached for 60 s), merges them, sorts them the same way the API does (`lib/completed.ts`, ties by order number), and returns the requested page. I checked that it gives the same order as sorting the combined list myself, for date, amount and order-number sorts.
5. **The single-order endpoint returns `{ data: {...} }`**, and unknown IDs return 404. The drawer shows "Order not found." for those.

**Client-side data flow.** `lib/useApi.ts` is a small fetch hook. It cancels the old request when filters change (so slow responses can't overwrite newer ones), keeps the previous rows visible (dimmed) while the next page loads, and exposes `reload()` for the Refresh and Try again buttons. Search is debounced by 400 ms so the API isn't called on every keystroke.

**Project structure**

```
app/
  page.tsx                 Suspense wrapper for the dashboard
  api/orders/route.ts      list proxy (validated params)
  api/orders/[id]/route.ts single order proxy
  api/meta/route.ts        statuses + branches for dropdowns
  api/branch-summary/route.ts  per-branch aggregation (cached)
components/
  Dashboard.tsx            page layout + URL state
  KpiCards.tsx  BranchChart.tsx  FilterBar.tsx
  OrdersTable.tsx  Pagination.tsx  OrderDrawer.tsx
  StatusBadge.tsx  States.tsx (skeleton / empty / error)
lib/
  hssb.ts      server-only API client (adds key, timeout, error mapping)
  aggregate.ts per-branch grouping (pure function)
  completed.ts "Completed" = Invoiced + Delivered, and the shared sort rule
  useApi.ts    client fetch hook
  useDialog.ts shared pop-up behaviour (focus, Esc, focus trap, scroll lock)
  format.ts    RM / date formatting (Malaysia time), status colours
  types.ts     API types
```

## How I tested it

- **Manual API check:** called `/meta`, the list, a single order and an unknown ID with the real key, to confirm field names, statuses, the summary behaviour and the 404 shape. A request without the key returns 401.
- **Checked the numbers:** the KPI totals (1,200 orders; 420 / 360 / 300 / 120; RM 998,244.30) match the API summary, and the branch totals add up to the same overall value.
- **Automated browser checks (Playwright, against a local stand-in of the API with the same response shape):**
  - Desktop (1366×768 and 1920×1080: the page fits the screen with no page scroll), tablet (820px) and mobile (390px) layouts
  - Chart expand window opens, a bar click filters and closes it; orders Expand hides the chart
  - Changing page or filter scrolls the table back to the top
  - KPI card click → filtered list and URL updated
  - Search debounce → URL and results update
  - Row click → drawer opens. Esc closes it, and Back does not re-open it
  - Shared link with `?id=` opens the drawer. An unknown ID shows "Order not found."
  - Empty search shows the empty state with Clear filters
  - Simulated API failure shows the error state with Try again (the chart keeps its cached data)
  - No console errors
- `npm run lint` and `npm run build` (TypeScript) both pass.

## Limitations and next steps

- The chart data can be up to 5 minutes old (shown on the chart). Fine for monitoring. It could be shortened if needed.
- The KPI cards don't change with filters, because the API's summary is company-wide. Filtered KPIs would need the same aggregation approach as the chart.
- No login. The app is public because the data is fictional. A real deployment would need authentication (for example, company SSO).
- No automated test suite in the repo yet. Next steps would be unit tests for `aggregateByBranch` and Playwright end-to-end tests in CI.
- No CSV export.

## AI-use disclosure

<!-- Elisha: check this section is accurate before submitting, and add anything you did yourself. -->

- **Tools used:** Claude (Anthropic), used as a coding assistant to explore the API, discuss the UX flow, write code, and run browser tests.
- **What I decided or changed:** the page flow (KPI cards → branch chart → filters → table → detail drawer), keeping filters in the URL, adding a branch chart instead of only cards, and the mobile card layout.
- **What I verified:** I checked the API responses myself, read through each file to understand it, ran the app locally against the real API, tested the filters, search, drawer, empty and error states on desktop and phone, and checked the totals against the API summary.
- **How it was tested:** see "How I tested it" above.
