# CampusEats — Reviewer Guide (Lesson 0, 1 & 2)

This file shows the reviewer **exactly where** each required concept lives in the project, **what it means**, **why it's there**, and the **real code** from this repo.

---

# Lesson 0 — Angular Essentials

## 1. An interface describing the API response

**Definition:** An `interface` is a TypeScript shape that describes what fields an object has (name + type), with no actual code behind it. It's used so TypeScript can check that the data coming back from the API (or being sent to it) has the right shape.

**Path:** [src/app/core/models/menu-item.model.ts](src/app/core/models/menu-item.model.ts)

**Purpose:** Describes exactly what a "menu item" object from the backend API looks like, so every part of the app (service, component, template) knows what fields exist and their types — catching mistakes at compile time instead of at runtime.

**Code:**
```ts
export type Category =
  | 'rice'
  | 'noodles'
  | 'snacks'
  | 'drinks'
  | 'desserts';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: Category;
  available: boolean;
  prepMinutes: number;
  rating: number;
  emoji: string;
  image: string;
}
```

**Explanation:** `MenuItem` says "any menu item object must have these 10 fields, with these exact types." `Category` restricts the `category` field to only 5 allowed string values instead of any string. This interface is then reused everywhere: `MenuService` types its HTTP response with it, `FoodCardComponent` uses it for its `@Input`, and the template autocompletes/validates `item.name`, `item.price`, etc.

---

## 2. A standalone component with its own imports

**Definition:** A "standalone" component is a component that declares its own dependencies (other components, directives, modules it needs) directly in its `@Component` decorator via the `imports` array — it does **not** need to be registered in an `NgModule`. This is the modern Angular approach (no more `app.module.ts`).

**Path:** [src/app/features/menu/menu.page.ts](src/app/features/menu/menu.page.ts)

**Purpose:** Lets a component be self-contained and lazy-loadable on its own, without a module wiring it up. You can see exactly what a component depends on just by reading its own file.

**Code:**
```ts
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    FoodCardComponent,
  ],
  templateUrl: './menu.page.html',
  styleUrl: './menu.page.scss',
})
export class MenuPage implements OnInit {
```

**Explanation:** `standalone: true` means this component isn't part of an `NgModule`. The `imports` array lists everything its template (`menu.page.html`) uses: the Ionic UI pieces (`IonHeader`, `IonToolbar`, etc.) and the custom `FoodCardComponent`. If `FoodCardComponent` weren't imported here, `<app-food-card>` in the HTML would fail to compile.

---

## 3. All four binding syntaxes, used at least once

**Definition — the 4 syntaxes:**
| Syntax | Name | Direction |
|---|---|---|
| `{{ value }}` | Interpolation | Component → HTML text |
| `[property]="value"` | Property binding | Component → HTML element property |
| `(event)="handler()"` | Event binding | HTML → Component |
| `[(ngModel)]="value"` | Two-way binding | Both directions at once |

**Paths & code:**

**a) Interpolation** — [src/app/shared/components/food-card/food-card.component.html:11](src/app/shared/components/food-card/food-card.component.html#L11)
```html
<h2>{{ item.emoji }} {{ item.name }}</h2>
```
Prints the value straight into the page as text.

**b) Property binding** — [src/app/shared/components/food-card/food-card.component.html:3-6](src/app/shared/components/food-card/food-card.component.html#L3-L6)
```html
<img [src]="item.image" [alt]="item.name" />
```
Sets the `src` and `alt` DOM properties of the `<img>` element from component data.

**c) Event binding** — [src/app/shared/components/food-card/food-card.component.html:32](src/app/shared/components/food-card/food-card.component.html#L32)
```html
<button (click)="onAddToCart()">Add to cart</button>
```
Runs a component method when the user clicks the button.

**d) Two-way binding** — [src/app/features/orders/orders.page.html:17-22](src/app/features/orders/orders.page.html#L17-L22)
```html
<input
  id="customerName"
  type="text"
  [(ngModel)]="customerName"
  placeholder="Enter your name"
/>
```
Keeps the `customerName` property and the input's typed text in sync both ways — type in the box, the property updates; change the property, the box updates. (Requires `FormsModule` imported in [orders.page.ts:2,22](src/app/features/orders/orders.page.ts#L2).)

---

## 4. `@for` with `track` and an `@empty` branch

**Definition:** `@for` is Angular's built-in control-flow block for looping over a list in a template (replaces the old `*ngFor`). `track` tells Angular how to identify each item so it can efficiently update the DOM instead of re-rendering everything. `@empty` is an optional branch that renders only when the list is empty.

**Path:** [src/app/features/menu/menu.page.html:39-50](src/app/features/menu/menu.page.html#L39-L50)

**Code:**
```html
@for (item of items(); track item.id) {

  <app-food-card
    [item]="item"
    (addToCart)="cart.add($event)"
  ></app-food-card>

} @empty {

  <p>No dishes available.</p>

}
```

**Explanation:** This loops through every `item` in `items()` (a signal, called as a function) and renders a `<app-food-card>` for each one. `track item.id` tells Angular to match DOM elements to items by their unique `id` — so if the list re-orders or updates, Angular reuses existing elements instead of destroying and recreating all of them (much faster). If `items()` is an empty array, the `@empty` block shows "No dishes available." instead. Same pattern is reused in [orders.page.html:69-99](src/app/features/orders/orders.page.html#L69-L99) for the orders list.

---

## 5. A signal, and a computed derived from it

**Definition:** A `signal` is a reactive box holding a value — read it by calling it as a function (`mySignal()`), update it with `.set()` or `.update()`, and anything reading it in a template auto-refreshes when it changes. A `computed` is a signal that's automatically derived/calculated from other signals — it recalculates itself whenever its dependencies change.

**Path:** [src/app/core/services/cart.service.ts](src/app/core/services/cart.service.ts)

**Code:**
```ts
private lines = signal<CartLine[]>(this.loadFromStorage());

readonly all = this.lines.asReadonly();

readonly count = computed(() =>
  this.lines().reduce(
    (total, line) => total + line.quantity,
    0
  )
);

readonly total = computed(() =>
  this.lines().reduce(
    (total, line) =>
      total + line.item.price * line.quantity,
    0
  )
);
```

**Explanation:** `lines` is the signal — the actual source of truth (the array of cart lines). `count` and `total` are `computed` values built **from** `lines`: `count` sums up all the quantities, `total` sums up price × quantity. Neither `count` nor `total` needs to be manually updated — whenever `lines` changes (via `add()`, `remove()`, `clear()`), Angular automatically recalculates `count` and `total` and any template using them (e.g. `cart.count()` in [menu.page.html:14](src/app/features/menu/menu.page.html#L14)) refreshes on its own.

---

## 6. `@Input` and `@Output` on the food card

**Definition:** `@Input()` marks a property that the **parent** component passes data **into** the child. `@Output()` marks an `EventEmitter` that the child uses to send events/data **back up** to the parent.

**Path:** [src/app/shared/components/food-card/food-card.component.ts](src/app/shared/components/food-card/food-card.component.ts)

**Code:**
```ts
export class FoodCardComponent {

  @Input() item!: MenuItem;

  @Output() addToCart = new EventEmitter<MenuItem>();

  onAddToCart(): void {
    this.addToCart.emit(this.item);
  }
}
```

**Explanation:** `@Input() item` lets the parent (`MenuPage`) hand a `MenuItem` down to each card: `<app-food-card [item]="item">`. `@Output() addToCart` lets the card notify the parent when its button is clicked, sending the item along: `this.addToCart.emit(this.item)`. The parent listens with `(addToCart)="cart.add($event)"` in [menu.page.html:41-44](src/app/features/menu/menu.page.html#L41-L44) — `$event` is the emitted `MenuItem`. This is the standard Angular parent↔child communication pattern: data flows down through `@Input`, events flow up through `@Output`.

---

# Lessons 1 & 2 — Architecture

## 1. `core` / `shared` / `features`, with files in the right place

**Definition:** A folder convention that separates code by role:
- **`core/`** — app-wide singletons: models (data shapes) and services (business logic/state). Loaded once, used everywhere.
- **`shared/`** — reusable, "dumb" UI pieces with no business logic of their own, used across multiple features.
- **`features/`** — the actual pages/screens of the app, each in its own folder, each one a specific user-facing feature.

**Path:** [src/app/](src/app)
```
src/app/
├── core/
│   ├── models/          → menu-item.model.ts, cart.model.ts, order.model.ts
│   └── services/        → menu.service.ts, cart.service.ts, order.service.ts
├── shared/
│   └── components/
│       └── food-card/   → food-card.component.ts/html/scss
├── features/
│   ├── menu/             → menu.page.ts/html/scss
│   ├── cart/              → cart.page.ts/html/scss
│   └── orders/            → orders.page.ts/html/scss
└── home/                  → home.page.ts
```

**Purpose:** Keeps the codebase predictable — anyone (including a reviewer) can guess where to find something. Data shapes and app-wide state logic go in `core`, reusable UI (like a card component used on multiple pages) goes in `shared`, and each screen the user navigates to gets its own folder in `features`. This also keeps pages "dumb": a page imports what it needs from `core`/`shared` instead of owning that logic itself.

---

## 2. Three services, each owning one slice of the business

**Definition:** A **service** is a plain class marked `@Injectable` that holds logic and/or state unrelated to any single component — things like "the menu," "the cart," "the orders." Each service here owns exactly one responsibility (separation of concerns).

**Paths:**
- [src/app/core/services/menu.service.ts](src/app/core/services/menu.service.ts) — owns the **menu**: fetching and holding the list of dishes.
- [src/app/core/services/cart.service.ts](src/app/core/services/cart.service.ts) — owns the **cart**: adding/removing items, totals, persisting to `localStorage`.
- [src/app/core/services/order.service.ts](src/app/core/services/order.service.ts) — owns **orders**: fetching past orders, submitting a new order.

**Purpose:** Instead of one giant service (or worse, logic scattered across pages), each concern is isolated. `CartPage`, `MenuPage`, and `OrderPage` all consume `CartService`, but nobody re-implements cart math — it lives in exactly one place.

**Code (shape of one, `MenuService`):**
```ts
@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private items = signal<MenuItem[]>([]);
  readonly all = this.items.asReadonly();

  load(): void {
    this.http.get<MenuItem[]>(`${this.api}/menu`).subscribe({
      next: (list) => this.items.set(list),
      ...
    });
  }
}
```

**Explanation:** `MenuService` is the only place that knows how to fetch the menu and holds the current list. `CartService` is the only place that knows how to add/remove cart lines. `OrderService` is the only place that knows how to fetch/create orders. Pages just `inject()` the service they need and read/call it — they never duplicate this logic.

---

## 3. `inject()` everywhere — and `new ServiceName()` nowhere

**Definition:** `inject()` is Angular's function-based way of getting an instance of a service (dependency injection), used instead of the old constructor-parameter style (`constructor(private http: HttpClient)`). Angular manages creating and sharing the single instance — you never manually build a service with `new`.

**Path:** used throughout, e.g. [src/app/features/menu/menu.page.ts:29-30](src/app/features/menu/menu.page.ts#L29-L30)
```ts
readonly menu = inject(MenuService);
readonly cart = inject(CartService);
```
Also in the services themselves, e.g. [src/app/core/services/menu.service.ts:10](src/app/core/services/menu.service.ts#L10):
```ts
private http = inject(HttpClient);
```

**Purpose:** `inject()` lets Angular hand you the **one shared instance** of a service (see `providedIn: 'root'` below) rather than each file creating its own separate copy with `new MenuService()`. If two components did `new CartService()` each, they'd have two different carts — a bug. `inject()` guarantees everyone shares the same instance and its state.

**Explanation:** Search the codebase for `new MenuService`, `new CartService`, or `new OrderService` — you won't find any. Every page and every service that needs another service gets it via `inject()`, which is what makes the shared state (cart contents, loaded menu, etc.) actually work across pages.

---

## 4. `providedIn: 'root'` so state survives navigation

**Definition:** `providedIn: 'root'` on `@Injectable()` tells Angular to create exactly **one instance** of the service for the whole app's lifetime, registered at the root injector — a singleton.

**Path:** [src/app/core/services/cart.service.ts:6-8](src/app/core/services/cart.service.ts#L6-L8)
```ts
@Injectable({
  providedIn: 'root',
})
export class CartService {
```
(Same on [menu.service.ts:6-8](src/app/core/services/menu.service.ts#L6-L8) and [order.service.ts:6-8](src/app/core/services/order.service.ts#L6-L8).)

**Purpose:** Because routes are lazy-loaded (see next point), if a service weren't a root singleton, navigating away and back to a page could reset its state. `providedIn: 'root'` guarantees the **same** `CartService` instance (and its `signal` data) is reused the entire time the app runs — so if you add 2 items to the cart on the Menu page, then navigate to the Cart page, the same 2 items are still there.

**Explanation:** This is what makes state "survive navigation" — the cart isn't reloaded or reset each time `CartPage` is created, because it isn't `CartPage` that owns the cart data at all — `CartService` does, and there's only ever one of it.

---

## 5. Every route lazy-loaded with `loadComponent`

**Definition:** Lazy loading means a route's component code is only downloaded/loaded when the user actually navigates to that route, instead of all routes being bundled into the initial app load. `loadComponent` is the standalone-component way to declare this (an alternative to `loadChildren` for whole modules).

**Path:** [src/app/app.routes.ts](src/app/app.routes.ts)

**Code:**
```ts
export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/menu.page').then((m) => m.MenuPage),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/orders.page').then((m) => m.OrderPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
```

**Explanation:** Every single route uses `loadComponent: () => import(...)` — a dynamic `import()` — instead of importing the page component at the top of the file and listing it directly. This means the JS for `OrderPage`, for example, is only fetched when the user navigates to `/orders`, keeping the initial bundle smaller and the app's first load faster. None of the routes eagerly import a page component.

---

## 6. No HTTP call written inside a page

**Definition:** "Pages" (components in `features/`) should only **display** data and **call service methods** — they should never call `HttpClient` directly. All HTTP calls live inside services (`core/services/`).

**Where to check:** Look at any page file, e.g. [src/app/features/menu/menu.page.ts](src/app/features/menu/menu.page.ts) or [src/app/features/orders/orders.page.ts](src/app/features/orders/orders.page.ts) — neither imports `HttpClient`.

**Code — a page only calls the service:**
```ts
// menu.page.ts
readonly menu = inject(MenuService);

ngOnInit(): void {
  this.menu.load();   // <-- delegates to the service, no HTTP here
}
```
**Code — the actual HTTP call lives in the service:**
```ts
// menu.service.ts
private http = inject(HttpClient);

load(): void {
  this.http.get<MenuItem[]>(`${this.api}/menu`).subscribe({
    next: (list) => this.items.set(list),
    error: () => this.failed.set(true),
  });
}
```

**Purpose:** Keeps pages simple ("dumb") and keeps all networking/error-handling logic in one testable, reusable place. If two pages both need the menu, neither has to know the API URL or repeat `.subscribe()` logic — they just call `menu.load()`.

**Explanation:** `OrderPage.placeOrder()` in [orders.page.ts:51-97](src/app/features/orders/orders.page.ts#L51-L97) builds the order object from form fields and the cart, then calls `this.orderService.create(order)` — it never touches `HttpClient` itself. The actual `this.http.post(...)` call is inside `OrderService.create()` in [order.service.ts:54-78](src/app/core/services/order.service.ts#L54-L78).

---

## Quick Reference Table

| # | Concept | File |
|---|---|---|
| L0.1 | Interface | [menu-item.model.ts](src/app/core/models/menu-item.model.ts) |
| L0.2 | Standalone component | [menu.page.ts](src/app/features/menu/menu.page.ts) |
| L0.3 | 4 bindings | [food-card.component.html](src/app/shared/components/food-card/food-card.component.html), [orders.page.html](src/app/features/orders/orders.page.html) |
| L0.4 | `@for` / `@empty` | [menu.page.html](src/app/features/menu/menu.page.html) |
| L0.5 | signal + computed | [cart.service.ts](src/app/core/services/cart.service.ts) |
| L0.6 | `@Input` / `@Output` | [food-card.component.ts](src/app/shared/components/food-card/food-card.component.ts) |
| L1/2.1 | core/shared/features | [src/app/](src/app) |
| L1/2.2 | 3 services | [core/services/](src/app/core/services) |
| L1/2.3 | `inject()` | all pages & services |
| L1/2.4 | `providedIn: 'root'` | all 3 services |
| L1/2.5 | Lazy routes | [app.routes.ts](src/app/app.routes.ts) |
| L1/2.6 | No HTTP in pages | pages call services only |
