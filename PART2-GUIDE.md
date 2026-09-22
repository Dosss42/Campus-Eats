# CampusEats — Part 2 Guide

Where each Part 2 requirement lives in the code, and what it actually does,
in plain language. Pairs with [REVIEWER-GUIDE.md](REVIEWER-GUIDE.md), which
covers Part 1.

---

# Architecture — carried over from Part 1

Nothing here changed in Part 2. It's listed because Part 2 builds directly
on top of it — the UI got new templates and pages, but no new state
management pattern.

## 1. `core` / `shared` / `features` folders

**Path:** [src/app/](src/app)

```
src/app/
├── core/
│   ├── models/     → menu-item, cart, order, auth
│   ├── services/   → menu, cart, order, auth
│   └── guards/     → auth.guard.ts
├── shared/
│   └── components/ → food-card, empty-state, error-state
├── features/
│   ├── menu/  cart/  orders/  login/
└── tabs/       → the navigation shell
```

**Plain English:** `core` is app-wide stuff loaded once (data shapes and
state). `shared` is reusable UI with no business logic of its own.
`features` is the actual screens. `tabs/` sits alongside `features` because
it's navigation chrome, not a screen you view content on.

## 2. Business logic only in services, never in pages

**Path:** every file in [src/app/core/services/](src/app/core/services)

**Plain English:** Open any page file (`menu.page.ts`, `orders.page.ts`,
etc.) — none of them `inject(HttpClient)`. They call `menu.load()`,
`orderService.create(...)`, and so on. The actual `http.get`/`http.post`
calls only exist inside the four services. If you ever need to change how
the app talks to the backend, there are exactly four files to touch.

## 3. `inject()` everywhere, `providedIn: 'root'`

**Path:** [auth.service.ts:14,17](src/app/core/services/auth.service.ts#L14),
[menu.service.ts:8,11](src/app/core/services/menu.service.ts#L8),
[order.service.ts:9,13](src/app/core/services/order.service.ts#L9)

**Plain English:** `providedIn: 'root'` means Angular creates exactly one
instance of each service for the whole app. `inject()` is how any page or
service grabs that single shared instance instead of making its own with
`new`. That's why the cart you built on the Menu page is still there when
you switch to the Cart tab — it's the same `CartService` instance the whole
time.

## 4. Signals and `computed` for state

**Path:** [cart.service.ts:16,23](src/app/core/services/cart.service.ts#L16)
(count/total), [order.service.ts:27](src/app/core/services/order.service.ts#L27)
(order count), [auth.service.ts:33](src/app/core/services/auth.service.ts#L33)
(`isAuthenticated`)

**Plain English:** A `signal` holds a value; a `computed` is a value that's
automatically recalculated from other signals. `isAuthenticated` is a good
example added in Part 2: it doesn't store `true`/`false` itself — it just
checks `this.tokenSig() !== null`. Log in, the token signal changes,
`isAuthenticated` flips on its own, and the Orders route guard (below)
reacts to it without anyone manually updating a flag.

## 5. Every route lazy-loaded

**Path:** [app.routes.ts](src/app/app.routes.ts)

**Plain English:** Every route uses `loadComponent: () => import(...)`
instead of importing the page at the top of the file. The code for the
Orders page, for example, is only downloaded when someone actually
navigates to `/tabs/orders`. This includes the two Part 2 additions
(`/login` and the `/tabs` shell) — nothing eager was added.

---

# Experience — added in Part 2

## 6. Ionic components, used for the right job

**Path:** spread across every template; the clearest single example is
[food-card.component.html](src/app/shared/components/food-card/food-card.component.html)

**Plain English:** Layout uses `ion-grid`/`ion-row`/`ion-col`. Data uses
`ion-card`/`ion-list`/`ion-item`/`ion-chip`. Navigation uses
`ion-tabs`/`ion-split-pane`/`ion-menu`. Interaction that needs a
decision uses `ion-toast` with buttons (the Cancel/Undo flow); interaction
that's just "wait a second" uses `ion-loading`; success/failure messages
use `ion-toast` without buttons. Nothing uses a modal where a route would
do, and nothing uses an alert for routine success feedback.

## 7. Layout reflows: phone → tablet → desktop

**Path:** [menu.page.html](src/app/features/menu/menu.page.html) (grid),
[tabs.page.html:1,5,53](src/app/tabs/tabs.page.html#L1) (shell)

**Plain English:** Food cards use
`<ion-col size="12" size-md="6" size-lg="4">` — one column on a phone, two
on a tablet, three on a desktop, no media queries needed. Separately, the
navigation itself adapts: `<ion-split-pane when="md">` shows the bottom tab
bar below 768px and swaps to a permanent side menu at 768px and up (see
[tabs.page.scss](src/app/tabs/tabs.page.scss) for the matching breakpoint
that hides the tab bar once the side menu takes over).

## 8. All five UI states, and how to actually trigger each one

**Path:** [menu.page.html](src/app/features/menu/menu.page.html) has all
five in one file; [empty-state](src/app/shared/components/empty-state) and
[error-state](src/app/shared/components/error-state) are the shared pieces.

| State | How to see it | What's showing |
|---|---|---|
| **Loading** | Reload the Menu tab | `ion-skeleton-text` cards shaped like the real grid |
| **Empty** | Search for "zzz" in the menu search bar | `EmptyStateComponent`: "No dishes found" |
| **Error** | Start the API with `?fail=true` simulated, or stop the server, then reload | `ErrorStateComponent` with a **Try Again** button that calls `menu.load()` |
| **Success** | Normal load | The populated `ion-grid` of food cards |
| **Sold out** | Any item with `available: false` (seeded: *Spaghetti Filipino Style*) | Chip reads "Sold out" (not just a color), **Add to Cart** is disabled |

**Plain English:** these aren't five separate hardcoded mockups — they're
the real `menu.loading()` / `menu.error()` / `items().length === 0` /
`item.available` signals from the actual service, so triggering the real
condition (an empty search, the backend's own `?fail=true` test flag, a
sold-out item in the seed data) shows the real state.

## 9. Accessibility

**Path:** [food-card.component.html](src/app/shared/components/food-card/food-card.component.html)
(status chip + alt text), [theme/variables.scss](src/theme/variables.scss)
(contrast-checked palette)

**Plain English:** Status is never color-only — the "Available"/"Sold out"
chip always has text and an icon next to the color. Every icon-only button
(remove from cart, cancel order, log out) has an `aria-label`. Every image
has `[alt]="item.name"`. The color palette in `variables.scss` has a
comment next to every color explaining its measured contrast ratio against
whatever it's paired with — I did **not** run an actual Lighthouse audit in
this environment (no browser here), so that's the one item on the original
checklist that's designed-for but not yet verified by the real tool. Run
`ionic serve`, open Chrome DevTools → Lighthouse → Accessibility, and that
closes the loop.

## 10. Navigation shell

**Path:** [tabs.page.html](src/app/tabs/tabs.page.html)

**Plain English:** `<ion-split-pane>` wraps two things: an `<ion-menu>`
(side nav list, for wide screens) and `<ion-tabs>` (bottom tab bar, for
narrow screens) — both point at the same three routes
(`/tabs/menu`, `/tabs/cart`, `/tabs/orders`). Only one is visible at a
time, controlled by the `when="md"` breakpoint. The Cart entry in both
shows a live badge from `cart.count()` — the same signal from Part 1,
not a second counter.

## 11. Route guard

**Path:** [core/guards/auth.guard.ts](src/app/core/guards/auth.guard.ts),
wired in [app.routes.ts:35](src/app/app.routes.ts#L35)

**Plain English:** `authGuard` is a function Angular runs before letting
you land on `/tabs/orders`. It checks `auth.isAuthenticated()` (see #4
above); if false, it redirects to `/login?returnUrl=/tabs/orders` instead
of loading the page. Log in on that screen and it sends you right back.
This is a **frontend-only** gate — it stops the Angular router from
rendering the page, but the backend's `/api/orders` endpoints don't
actually check the token, so it's demonstrating the routing pattern, not
securing the data (the API doc says the same thing).

## 12. Cancel with Undo

**Path:** [orders.page.ts:166-192](src/app/features/orders/orders.page.ts#L166),
[order.service.ts:91-110](src/app/core/services/order.service.ts#L91)

**Plain English:** Tap **Cancel Order** and it vanishes from the list
immediately (`removeLocally` — just pulls it out of the in-memory signal,
no network call yet). A 4-second `ion-toast` appears with an **Undo**
button. Tap Undo → `restoreLocally` puts it back in the list, nothing was
ever sent to the server. Let the toast expire → `orderService.cancel()`
finally fires the real `DELETE /api/orders/{id}` request. Either way, only
one network call ever happens (or zero, if undone) — no duplicate
cancel logic.

---

## Quick reference

| # | Item | File |
|---|---|---|
| 1 | core/shared/features | [src/app/](src/app) |
| 2 | No HTTP in pages | [core/services/](src/app/core/services) |
| 3 | `inject()` / `providedIn: 'root'` | all services |
| 4 | Signals + computed | [cart.service.ts](src/app/core/services/cart.service.ts), [auth.service.ts](src/app/core/services/auth.service.ts) |
| 5 | Lazy routes | [app.routes.ts](src/app/app.routes.ts) |
| 6 | Ionic components | [food-card.component.html](src/app/shared/components/food-card/food-card.component.html) |
| 7 | Responsive grid + shell | [menu.page.html](src/app/features/menu/menu.page.html), [tabs.page.html](src/app/tabs/tabs.page.html) |
| 8 | Five states | [menu.page.html](src/app/features/menu/menu.page.html) |
| 9 | Accessibility | [theme/variables.scss](src/theme/variables.scss) |
| 10 | Navigation shell | [tabs.page.html](src/app/tabs/tabs.page.html) |
| 11 | Route guard | [auth.guard.ts](src/app/core/guards/auth.guard.ts) |
| 12 | Cancel + Undo | [orders.page.ts](src/app/features/orders/orders.page.ts) |
