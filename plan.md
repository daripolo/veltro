# Authenticated dashboard redesign plan

## Purpose

Redesign the authenticated banking experience in `src/app/(auth)` into one coherent, accessible, responsive Finguard-style dashboard system. The supplied image is the visual reference for **layout principles**—calm warm canvas, compact white surfaces, clear financial hierarchy, a rail navigation pattern, metric cards, and dense but readable activity data. It is not a source for product name, user data, account values, or brand assets.

This document is intentionally implementation-ready. A new engineer or AI model should be able to continue from any phase without changing the data model or breaking existing banking workflows.

## Scope and guardrails

### In scope

- The authenticated application shell and all pages under `src/app/(auth)`.
- A reusable dashboard component system used by home, accounts, cards, transactions, transfers, deposit, conversion, investments, loans, profile, settings, notifications, support, and admin pages.
- Responsive desktop, tablet, and mobile behavior.
- Loading, empty, error, destructive-action, and success states.
- Accessibility, interaction polish, and visual QA.

### Out of scope unless explicitly approved

- Changing Convex schemas, monetary calculations, permissions, transfer flows, or backend mutation semantics.
- Copying the reference image's brand, identity, figures, or account data.
- A new visual style for public/authentication pages (`src/app/auth` and `src/app/(landing)`).
- Adding a theme switcher; establish one high-quality light dashboard first. Dark mode can be a separate, token-driven phase after parity is complete.

### Non-negotiables

- Keep all existing routes and deep links working.
- Keep `fetchAuthQuery` authentication, email verification, and onboarding redirects in `src/app/(auth)/layout.tsx` intact.
- Reuse live Convex queries/mutations. Presentation components receive normalized view models; they must not silently change financial values.
- Never use the reference image's sample values as production data.
- A visual refactor must not remove confirmations, validation, disabled states, or error messages from money-moving flows.

## Current-state audit

### What is already working

- `src/app/(auth)/layout.tsx` owns access control and has a desktop sidebar shell.
- `src/app/(auth)/components/Sidebar.tsx`, `TopHeader.tsx`, and home components show the intended newer light Finguard direction.
- Home already connects to real Convex account, card, and transaction data.
- Recharts, Framer Motion, Solar icons, Radix packages, Tailwind v4, and shared `Button`, `Card`, and `Dialog` building blocks are already installed.
- Mobile navigation, notification data, avatar data, and several complete money workflows exist and can be retained behind the new visual primitives.

### Main UX and implementation issues to correct

| Priority | Finding | Why it matters | Direction |
| --- | --- | --- | --- |
| P0 | Two competing shells exist: the light `Sidebar`/`TopHeader` in the route group, and legacy dark `Header`/`MobileBottomNav` imported by many pages. | Navigation, brand, breakpoints, and user controls differ page to page. | Build one `DashboardShell`; migrate every route to it; retire legacy per-page shell imports only after migration. |
| P0 | Visual tokens conflict. `globals.css` exposes light orange tokens while many screens use `bg-charcoal`, `rich-black`, `luxury-gold`, and white-on-dark controls. | The dashboard feels like unrelated products and is hard to maintain. | Define semantic dashboard tokens; eliminate direct legacy color utilities from authenticated pages. |
| P0 | The route-group layout currently renders the sidebar, while individual pages may render another header and bottom navigation. | Duplicate chrome wastes space, makes sticky behavior unreliable, and risks duplicate navigation landmarks. | Shell alone owns desktop navigation, mobile navigation, and top utility header. |
| P1 | Account cards, action buttons, lists, inputs, modals, and states are hand-styled repeatedly. | Inconsistent focus behavior, borders, sizing, and motion make the product less predictable. | Create reusable primitives before page-by-page styling. |
| P1 | The home page only renders `DashboardHero`, `QuickActions`, `RecentTransactions`, and promotional `FeatureHighlights`; richer dashboard components exist but are not composed there. | The reference's information hierarchy is not yet represented, and useful data components are orphaned. | Compose a focused dashboard: balance/account summary, transfer actions, financial snapshot, spending, recent activity, cards/goals as progressive modules. |
| P1 | Some navigation names/routes do not match across implementations (for example `Card` vs `Cards`, `Recipients` routes to `/transfers`; the legacy header has Investments and Loans). | Users cannot build a stable mental model of where a task lives. | Create a single navigation configuration and route-level active matching. |
| P1 | Layout widths and overflow assumptions vary by page (`ScrollArea`, fixed panels, dense tables, per-page mobile nav). | Tables and flows are likely brittle at small widths. | Apply responsive layout contracts and mobile alternatives per data density. |
| P2 | Empty/loading/error states are implemented inconsistently. | Banking data can be slow or absent; blank regions erode trust. | Standardize skeleton, empty, error, retry, and action-pending states. |
| P2 | Motion is applied ad hoc to most cards/buttons. | Excess movement increases cognitive load and can violate reduced-motion expectations. | Use limited motion recipes with `prefers-reduced-motion` support. |

### Route inventory

The shared shell must cover these existing route areas without changing their URLs:

| Area | Existing route(s) | Primary user job | Migration focus |
| --- | --- | --- | --- |
| Overview | `/home` | Understand available money and take a common next action. | New information hierarchy and dashboard grid. |
| Accounts | `/accounts`, `/accounts/[accountId]` | Inspect balances and account details. | Account cards, filtering, detail header, statements. |
| Cards | `/cards` | View, freeze, manage, or request cards. | Card gallery, safety controls, confirmation modals. |
| Activity | `/transactions`, `/notifications` | Search, filter, understand events. | Responsive data table/list, filters, status chips. |
| Money movement | `/transfers`, `/deposit`, `/convert` | Send, request, top up, and exchange money. | Stepper, recipient/account selector, amount field, review/receipt patterns. |
| Planning | `/investments`, `/loans`, `/loans/apply` | Review investment/loan status or apply. | Summary metrics, product cards, forms, status timeline. |
| Personal | `/profile`, `/settings`, `/support` | Manage identity, preferences, security, get help. | Settings sections, safer forms, support task routing. |
| Operations | `/admin` | Administration. | Preserve permissions; use the same visual language only where appropriate. |

## Design brief

### Product intent

The dashboard should feel like a composed financial workspace: users immediately see what matters, can act on money confidently, and can scan activity without feeling buried in controls. The personality is calm and precise, not flashy or gamified.

### Visual direction derived from the reference

- Warm off-white page canvas, white elevated surfaces, restrained shadows, and thin cool-gray borders.
- Dark ink for financial totals and text; use one warm orange/coral brand accent for the primary action and selected states.
- A persistent, compact navigation rail on large screens; a thumb-reachable bottom nav on small screens.
- Dense information organized in a predictable grid—not a collection of oversized marketing cards.
- Strong information hierarchy: greeting/context, aggregate balance, action row, financial indicators, then activity.
- Rounded corners are friendly but disciplined: 12px controls, 16px nested surfaces, 20px primary cards. Do not make every surface a `rounded-3xl` blob.

### Brand decision to resolve before implementation

The audited code contains both **Finguard** and **Arxforth** naming. Preserve the product's approved canonical name and logo in the new system. Until the product owner confirms it, centralize display name, tag line, and logo source in one `brand.ts` configuration file; do not hard-code either name in new components.

## Target information architecture

### Unified navigation

Use a single configuration array, for example `src/app/(auth)/components/navigation.ts`, as the only source for desktop rail and mobile bottom navigation. Recommended visible primary items:

1. Overview (`/home`)
2. Accounts (`/accounts`)
3. Cards (`/cards`)
4. Transfers (`/transfers`)
5. Activity (`/transactions`)

Place Investments and Loans in a labelled **Grow** group; Settings, Help, and Sign out sit in the rail footer or profile menu. Notifications belong to the top utility header, not the primary navigation. If product analytics say Investments/Loans are high-frequency, promote them only after testing the seven-item navigation limit.

### Desktop shell

```text
┌────────── navigation rail ──────────┬───────────── dashboard content ─────────────┐
│ Brand                               │ Page title / optional context  Search  Bell Profile │
│ Overview                             │                                                   │
│ Accounts                             │ Page-specific content grid                        │
│ Cards                                │                                                   │
│ Transfers                            │                                                   │
│ Activity                             │                                                   │
│                                      │                                                   │
│ Grow: Investments, Loans             │                                                   │
│ Settings / Help / Sign out           │                                                   │
└──────────────────────────────────────┴───────────────────────────────────────────┘
```

- Rail: 240px expanded at `lg` and above; icon-only collapsed mode is optional after the first rollout is stable.
- Content: max-width 1440px, fluid horizontal padding (`16px` mobile, `24px` tablet, `32px` desktop), vertical rhythm of 24px.
- Header: sticky within content, opaque enough to retain readability; it contains only global controls. Page titles and primary actions remain in `PageHeader`.

### Mobile shell

- Header: brand/page context plus notifications/profile; hide desktop rail.
- Bottom nav: five top tasks only (Overview, Accounts, Cards, Transfers, Activity). Add bottom padding equal to nav height plus safe area to every page through the shell.
- Secondary destinations (Investments, Loans, Settings, Help) move to profile/More sheet.
- Forms stay single-column; their review step is a bottom sheet or full-height dialog, never a side panel that clips.

## Design system and tokens

### Token strategy

Create semantic variables in `src/app/globals.css` (or `src/styles/dashboard-tokens.css` imported there). Components should consume semantic roles, not hex values or legacy names.

| Token group | Suggested roles | Initial light values / behavior |
| --- | --- | --- |
| Canvas and surfaces | `--dashboard-canvas`, `--surface`, `--surface-subtle`, `--surface-raised` | warm neutral canvas; white cards; faint gray sub-surfaces. |
| Ink | `--ink`, `--ink-muted`, `--ink-faint`, `--on-accent` | near-black primary, accessible slate secondary, quiet metadata. |
| Brand and state | `--brand`, `--brand-hover`, `--positive`, `--warning`, `--danger`, `--info` | coral/orange primary; never use color as the only status signal. |
| Borders and focus | `--border`, `--border-strong`, `--focus-ring` | subtle hairline borders; visible 2px focus ring with offset. |
| Elevation | `--shadow-card`, `--shadow-float`, `--shadow-modal` | shallow default card shadow; stronger only for overlays. |
| Shape and spacing | `--radius-control`, `--radius-card`, `--space-*` | 12/16/20px radii; use an intentional 4px spacing scale. |
| Type | display, page title, section title, body, label, numeric amount | tabular numerals for money; labels should remain legible at 12–14px. |

Remove or deprecate new use of `bg-charcoal`, `rich-black`, `luxury-gold`, `soft-gold`, and `primary-dark` in the authenticated dashboard. Do not delete a legacy token until all consuming pages have migrated.

### Component rules

- Each reusable component must have a small, typed API with variants. Do not accept a large `className` override as the primary means of changing behavior.
- Use `cn` from `@/lib/utils` for deliberate class composition.
- Use Solar icons consistently; define a standard 18px/20px/24px scale and always pair icon-only buttons with `aria-label` and tooltip text.
- Render currency values through a shared formatter using the account currency and locale, never copied `$` string literals in components.
- Render dates via a shared date/time formatter so transactions, notifications, receipts, and tables are consistent.
- Prefer server components for static composition; isolate Convex hooks and UI state in client feature components.

## Component build list

Create the following folder first: `src/app/(auth)/components/dashboard-ui/`. The list deliberately separates primitives, shell, and financial patterns so route components remain readable.

### Foundation primitives (build once)

| Component | Key API / variants | Used by |
| --- | --- | --- |
| `DashboardSurface` | `variant: default | subtle | accent | danger`, `padding`, `as` | All cards, panels, form sections. Replaces repeated `bg-* rounded-* border` strings. |
| `Button` / `IconButton` | `variant: primary | secondary | outline | ghost | danger`; `size`; loading state | All pages. Reconcile and then supersede `src/components/base/Button.tsx`. |
| `StatusBadge` | `status`, `label`, optional icon | Transaction, card, verification, loan, transfer statuses. |
| `PageHeader` | eyebrow, title, description, actions, back affordance | Every route page. |
| `SectionHeader` | title, description, action, density | Panels and dashboard modules. |
| `EmptyState` | title, copy, icon, action | Empty queries across all screens. |
| `LoadingState` / `Skeleton` | line, card, list, table-row variants | Query loading and pending navigation. |
| `InlineAlert` | `info | success | warning | danger`, title, children, dismiss | Validation summaries, support, operational notices. |
| `FormField` | label, hint, error, required, child input | Forms; keeps field spacing and accessibility consistent. |
| `SearchField` and `FilterButton` | value, change, clear, filter count | Transactions, accounts, recipients. |
| `ConfirmDialog` | title, body, severity, confirm copy, loading | Freeze card, delete card, transfer final confirmation. |
| `SegmentedControl` / `Tabs` | items, selected, change | Account/currency/chart intervals; use accessible keyboard navigation. |
| `ProgressBar` | value, label, tone | savings, applications, budgets, verification. |

### Shell components

| Component | Responsibilities |
| --- | --- |
| `DashboardShell` | owns canvas, desktop rail, responsive header, content padding, mobile navigation offset. It replaces direct shell composition in route pages. |
| `DesktopSidebar` | uses the canonical navigation config; shows product identity, primary/secondary groups, active route, and sign out. |
| `MobileNavigation` | derived from the same config; limits to five primary tasks and provides More access. |
| `DashboardTopbar` | global search trigger (only if functional), notification control with unread count, profile menu; no page-specific headings. |
| `ProfileMenu` | profile link, settings, help, sign out; handles keyboard focus and outside click through an accessible primitive. |
| `NotificationMenu` | preview, mark-read action, link to `/notifications`, empty state. |

### Financial patterns

| Component | Required behavior |
| --- | --- |
| `BalanceCard` | currency identity, account name, masked/unmasked total, compact account suffix, status/primary indicator, optional action menu. Mask setting is per user/session, never a visual-only icon. |
| `TotalBalanceCard` | normalized aggregate total, currency selector if supported, trend period, transfer/request actions. Must define whether cross-currency total is converted or grouped; do not sum unlike currencies without a rate. |
| `MetricCard` | title, value, delta, comparison period, status tone, tooltip/source note. Use for income, spend, cash flow, goals. |
| `QuickActionBar` | 2–4 high-confidence actions: Send, Request, Add money, Convert. Maintains clear labels on mobile. |
| `TransactionList` | compact mobile-first list, group by date, direction, accessible row navigation, pending/status indicator, empty/loading state. |
| `TransactionTable` | desktop columns, search/filter/sort controls, horizontally safe fallback; clicking a row reveals details. |
| `TransactionRow` | canonical icon, merchant/description, date, account, amount, status. Shared by list/table detail composition. |
| `SpendingChartCard` | period control, semantic legend, text alternative, zero-data state, responsive Recharts size. |
| `BudgetProgressCard` | available/spent/budget, warning thresholds, no-color-only status. |
| `AccountPicker` | searchable, keyboard-accessible controlled chooser for transfer, deposit, conversion, and cards. |
| `MoneyInput` | locale-aware amount input, currency prefix/code, available balance, validation and max action. Do not format destructively while users type. |
| `TransferStepper` | numbered, labelled steps with completed/current/error states; works with keyboard and announces step changes. |
| `ReviewReceipt` | immutable summary of transfer/deposit/conversion, explicit fee/rate/date and transaction reference. |
| `PaymentCard` | visual card only; supports masked data, selected/frozen states, accessible non-color status. |
| `GoalCard` | target/current/deadline/progress/action, compact and list variants. |

### Suggested file layout

```text
src/app/(auth)/
  components/
    DashboardShell.tsx
    navigation.ts
    dashboard-ui/
      button.tsx
      dashboard-surface.tsx
      page-header.tsx
      section-header.tsx
      status-badge.tsx
      form-field.tsx
      states.tsx
      confirm-dialog.tsx
      transaction-list.tsx
      transaction-table.tsx
      balance-card.tsx
      metric-card.tsx
      money-input.tsx
      transfer-stepper.tsx
      charts/
      formatters.ts
  home/
    components/
      OverviewDashboard.tsx
      ...route-specific composition only
```

Keep generic components in `dashboard-ui`; keep domain-specific composition in the owning route. Do not move every page into a generic component directory.

## Home dashboard redesign

### Desktop composition

1. `PageHeader`: time-aware greeting, concise supporting text, and no duplicate user identity (the profile is already in the top bar).
2. A 12-column grid. The main aggregate balance card occupies 5–7 columns; a financial snapshot contains income, outflow, and cash-flow metrics; the spending chart fills the complementary panel.
3. `QuickActionBar` immediately below the balance so send/request/add money remain easy to find.
4. Accounts/wallets in a scroll-free responsive card row, not two hard-coded USD/IDR cards. It maps over actual accounts and handles zero/more than two accounts.
5. Recent activity takes the largest lower panel; show five to eight entries and a visible “View all transactions” link.
6. Add goals, card controls, and insights as compact secondary panels only when their data exists. Promotional “Why choose…” content should move to support/education or be removed from the authenticated landing screen.

### Home data corrections before visual polish

- `DashboardHero` must not assume only USD and IDR accounts or label the payment network from a bank-account card.
- Never present a sum of different currencies as a total balance without an explicit conversion rate and timestamp. Prefer per-currency grouped totals until an approved FX total exists.
- Recent activity should allow the user to reach the transaction history and should not be limited to “today” if this results in an empty primary dashboard section.
- Ensure account provisioning mutations are not triggered from multiple visually unrelated widgets; choose one safe bootstrapping location and make it idempotent.

## Page migration sequence

### Phase 0 — Baseline and design decisions

1. Capture desktop (1440px), tablet (1024px), and mobile (390px) screenshots of `/home`, `/accounts`, `/cards`, `/transactions`, `/transfers`, `/deposit`, and `/settings` using seeded or a safe test account.
2. Record current query, mutation, redirect, and URL/filter behavior for each route. This is the regression baseline.
3. Confirm the canonical brand name/logo and whether aggregate cross-currency balances are permitted.
4. Write visual acceptance criteria for every route before changing shared layout code.

**Exit criterion:** baseline screenshots, route inventory, and product decisions are attached to the implementation task.

### Phase 1 — Establish the system and shell

1. Add dashboard semantic tokens and a small typography/spacing/radius/elevation scale.
2. Build and unit-smoke-test foundation primitives and shared formatters.
3. Create `DashboardShell` and navigation config; update `src/app/(auth)/layout.tsx` to render it around `{children}`.
4. Migrate notifications/profile actions from legacy `Header` to the shell without changing their Convex calls.
5. Make the shell responsive and add content bottom padding for `MobileNavigation`.
6. Remove `Header` and `MobileBottomNav` imports from migrated authenticated routes; do not leave duplicate chrome.

**Exit criterion:** `/home` and one non-home page use the same shell correctly at 390px, 1024px, and 1440px.

### Phase 2 — Redesign the overview first

1. Normalize account, transaction, and money formatting into view-model helpers.
2. Replace `DashboardHero`, `QuickActions`, and `RecentTransactions` with the new financial patterns.
3. Add financial snapshot and chart modules using current data only; include skeleton, empty, and no-data states.
4. Use a 12-column desktop grid, 6-column tablet grid, and single-column mobile stack.
5. Test balance masking, empty accounts, no transactions, multiple currencies, unread notifications, and keyboard navigation.

**Exit criterion:** the home page provides a useful scan in under five seconds and all actionable controls work without visual placeholders.

### Phase 3 — Migrate high-frequency money tasks

1. Transactions: use the responsive table/list pair, unified search/filter controls, status badges, and transaction detail surface.
2. Transfers: preserve Local/International/Email/Request logic but compose each flow from `TransferStepper`, `AccountPicker`, `MoneyInput`, `FormField`, `ReviewReceipt`, and `ConfirmDialog`.
3. Deposit and convert: reuse the same amount, account selection, rate/fee disclosure, and receipt patterns.
4. Accounts and account detail: use account cards, balance breakdown, statement/activity panel, and contextual actions.
5. Cards: use `PaymentCard`, state badges, and confirm dialogs; ensure freeze/unfreeze is explicitly labelled and confirmed.

**Exit criterion:** every money-changing operation exposes amount, source, destination, fee/rate, validation, review, success, and failure states consistently.

### Phase 4 — Migrate planning and personal areas

1. Investments and loans: shared metric cards, status timeline/progress, product/application cards, clear risk disclosures where relevant.
2. Profile and settings: page header, sectioned form surfaces, inline validation, save status, and accessible toggles.
3. Notifications and support: shared timeline/list patterns, empty states, accessible FAQs/forms, and visible response expectations.
4. Admin: retain its authorization component and operational data; only migrate visual primitives after its role restrictions are validated.

**Exit criterion:** no authenticated route relies on the legacy dark dashboard styling or duplicate navigation.

### Phase 5 — Polish, QA, and retirement

1. Search the route group for `bg-charcoal`, `rich-black`, `luxury-gold`, direct duplicate header/nav imports, and one-off legacy controls; migrate or document exceptions.
2. Run typecheck/build/lint and resolve all UI-related warnings.
3. Run keyboard, screen-reader, zoom, responsive, and visual regression checks described below.
4. Delete or deprecate obsolete dashboard-only components only after all imports are migrated and a second import search is clean.
5. Update this document's progress log and add component usage examples close to the component source.

## Responsive contracts

| Breakpoint | Layout behavior |
| --- | --- |
| 0–639px | One content column; mobile top bar + bottom nav; full-width actions; transaction cards instead of tables; dialogs become sheets/full-screen as necessary. |
| 640–1023px | Two-column metrics where content permits; sidebar remains hidden; header actions compact; tables may scroll only inside a labelled region. |
| 1024–1279px | Persistent rail; 6-column grid; chart and activity may stack if their readable minimum widths conflict. |
| 1280px+ | Persistent rail; 12-column grid; parallel analysis/activity panels; no line length above approximately 75 characters in prose. |

Minimum touch target: 44 by 44 CSS pixels for interactive controls. Every route must be usable at 200% browser zoom and 320 CSS-pixel width without horizontal page scrolling.

## Accessibility checklist

- Use one `<main>` landmark per route and semantic `<nav>` labels for rail/mobile navigation.
- Keep headings sequential (`h1` page title, `h2` section titles); do not use text size as hierarchy.
- All icon-only controls need accessible names; all images/logos need appropriate `alt` text.
- Minimum text contrast is 4.5:1; large text and graphical status must meet WCAG AA. Status uses label/icon plus color.
- Use visible `:focus-visible` rings on buttons, links, inputs, tabs, dialogs, and menu items.
- Dialogs trap focus, close via Escape, restore trigger focus, and announce their purpose.
- Error text connects to its field with `aria-describedby`; submit errors are announced with an appropriate live region.
- Chart cards expose a concise textual summary/table equivalent, not information available only by hover tooltip.
- Respect `prefers-reduced-motion`; suppress nonessential card entrance, hover lift, shimmer, and continuous effects.
- Monetary amount masking must be a real state reflected in accessible labels and must not reveal values in screen-reader-only text.

## Interaction and content rules

- Primary CTA is one per page header. Secondary actions remain outline/ghost and are visually quieter.
- Always use an explicit verb: “Send money”, “Request money”, “Add money”, “Review transfer”, not a generic “Continue” when ambiguity is possible.
- Before irreversible/money-moving actions, show the exact source, destination, amount, currency, rate, fee, and expected delivery time.
- Pending and failed transactions remain visible with clear next steps; never just change their color.
- Provide a real destination for “View all”, “See details”, and search/filter controls. Remove nonfunctional affordances until connected.
- Use optimistic UI only when the underlying mutation/rollback behavior is already reliable; otherwise show a pending state and prevent double submission.

## Data and technical integration notes

- Keep Convex query/mutation ownership in route feature components or small hooks such as `useDashboardAccounts`; primitives should receive plain, typed props.
- Add formatters in a shared module, e.g. `dashboard-ui/formatters.ts`: `formatMoney`, `formatCompactMoney`, `formatDateTime`, `formatRelativeTime`, `formatAccountSuffix`.
- Use `Intl.NumberFormat` with an explicit locale/currency. Preserve account currency from Convex.
- Create view-model mappers for account, card, transaction, notification, and transfer review data. This prevents backend shape checks such as `"_id" in account` from leaking throughout UI components.
- Avoid calling `ensureUserAccounts` / `ensureDefaultCard` from multiple dashboard widgets. Pick a known lifecycle location and keep operations idempotent.
- Keep chart transformations memoized and test zero, one-point, negative, mixed-currency, and malformed-date inputs.
- Keep large charts and modal-heavy modules client-side; do not convert whole page trees to client components when only a child needs state.

## QA and definition of done

### Functional checks

- Authentication, verification, and onboarding redirects are unchanged.
- All existing page URLs, route parameters, form validation, mutations, and error handling still work.
- Sidebar/mobile nav active states work for nested routes such as `/accounts/[accountId]` and `/loans/apply`.
- Notifications, profile menu, sign-out, card controls, filters, transfer flow, deposit, conversion, and account selection work after migration.

### Visual checks

- Compare before/after screenshots at 390px, 768px, 1024px, and 1440px.
- Check empty, loading, long-name, long-amount, zero-balance, error, and high-density transaction data states.
- Confirm no duplicate header, sidebar, or bottom navigation appears on any authenticated route.
- Confirm table content, dialogs, tooltips, and dropdowns are never clipped by page/scroll containers.

### Quality checks

- Run `npm run lint` and `npm run build` after each migration milestone.
- Test keyboard-only navigation, Escape behavior, focus restoration, and form error recovery.
- Test with reduced motion enabled, 200% zoom, and a narrow 320px viewport.
- Manually inspect with a screen reader on at least home, transfers, cards, and transaction history.
- Do not ship new console logs; remove the current dashboard layout `console.log` when touching that file.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A global shell change breaks page-specific scroll or mobile spacing. | Migrate shell first with two representative pages; test all routes before removing legacy nav. |
| Styling work changes money-flow behavior. | Preserve hooks and mutations behind presentational wrappers; perform transfer/deposit smoke tests after each shared component change. |
| Currency totals become misleading. | Show per-currency balances until approved FX conversion metadata is available. |
| Large route pages become harder to maintain during visual migration. | Extract only repeated UI patterns; retain domain logic in route feature components; migrate one route at a time. |
| Inconsistent brand language remains. | Use centralized `brand.ts`; confirm canonical brand before large copy/asset changes. |
| Motion causes performance/accessibility regressions. | Keep motion to opacity/transform, gate it by reduced-motion, and avoid animating long lists and layout-critical dimensions. |

## Handoff progress log

- [x] Inspected the authenticated route group, existing shared components, home components, global tokens, and installed UI dependencies.
- [x] Identified the light Finguard shell versus legacy dark Arxforth shell split.
- [x] Defined a target visual system, reusable component inventory, migration order, QA, and risk controls.
- [ ] Capture baseline screenshots and confirm canonical product brand / cross-currency aggregation policy.
- [ ] Implement Phase 1 shared tokens and `DashboardShell`.
- [ ] Implement and migrate the redesigned home overview.
- [ ] Migrate money movement, remaining routes, and complete QA.

## First implementation task

Start with Phase 1 only. Add semantic dashboard tokens, central navigation/brand configuration, `DashboardShell`, desktop/sidebar/mobile navigation, topbar, and the foundation primitives. Migrate `/home` plus one secondary page (recommended `/transactions`) as the proof pair. Do not visually refactor all routes in the same change. After screenshot QA at all breakpoints, proceed to the overview and high-frequency flows in the order above.
