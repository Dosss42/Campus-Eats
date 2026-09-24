import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonChip,
  IonLabel,
  IonModal,
  RefresherCustomEvent,
  ToastController,
} from '@ionic/angular';

import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { MenuItem } from '../../core/models/menu-item.model';
import { FoodCardComponent } from '../../shared/components/food-card/food-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { AccountButtonComponent } from '../../shared/components/account-button/account-button.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

type PriceRange = 'all' | 'under-50' | '50-100' | 'over-100';

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: 'all', label: 'Any price' },
  { value: 'under-50', label: 'Under ₱50' },
  { value: '50-100', label: '₱50 – ₱100' },
  { value: 'over-100', label: 'Over ₱100' },
];

/** How many cards a page shows before Pagination moves to the next one. */
const PAGE_SIZE = 30;

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonButtons,
    IonButton,
    IonIcon,
    IonBadge,
    IonChip,
    IonLabel,
    IonModal,
    FoodCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    AccountButtonComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './menu.page.html',
  styleUrl: './menu.page.scss',
})
export class MenuPage implements OnInit {

  readonly menu = inject(MenuService);
  readonly cart = inject(CartService);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  readonly searchTerm = signal('');

  /** 'all' or one of the category values present in the loaded menu. */
  readonly selectedCategory = signal<MenuItem['category'] | 'all'>('all');

  readonly selectedPriceRange = signal<PriceRange>('all');

  readonly priceRanges = PRICE_RANGES;

  /** The catalog — derived from whatever categories actually come back
   * from the menu, instead of a hardcoded list, so it never drifts from
   * the real data. Shown as a horizontal strip on mobile, a collapsible
   * left sidebar (with the price filter) on wider screens. */
  readonly categories = computed(() =>
    Array.from(new Set(this.menu.all().map((item) => item.category)))
  );

  /** Sidebar is desktop-only UI; open by default there, collapsible. */
  readonly sidebarOpen = signal(true);

  /** Drives the dot on the mobile filter icon so it's obvious a filter
   * is narrowing the results even while the sheet itself is closed. */
  readonly hasActiveFilters = computed(
    () => this.selectedCategory() !== 'all' || this.selectedPriceRange() !== 'all'
  );

  readonly items = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();
    const priceRange = this.selectedPriceRange();

    return this.menu.all().filter((item) => {
      const matchesCategory =
        category === 'all' || item.category === category;

      const matchesTerm =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);

      const matchesPrice = this.matchesPriceRange(item.price, priceRange);

      return matchesCategory && matchesTerm && matchesPrice;
    });
  });

  readonly currentPage = signal(1);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.items().length / PAGE_SIZE))
  );

  /** The slice of `items()` the current page actually shows. */
  readonly pagedItems = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.items().slice(start, start + PAGE_SIZE);
  });

  /** Placeholder rows shown by the loading skeleton. */
  readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  private pendingRefresh: RefresherCustomEvent | null = null;

  constructor() {
    // Completes the pull-to-refresh spinner once the reload finishes,
    // without changing MenuService.load()'s existing signature.
    effect(() => {
      if (!this.menu.loading() && this.pendingRefresh) {
        this.pendingRefresh.target.complete();
        this.pendingRefresh = null;
      }
    });
  }

  ngOnInit(): void {
    this.menu.load();
  }

  onSearch(term: string | null | undefined): void {
    this.searchTerm.set(term ?? '');
    this.currentPage.set(1);
  }

  onSelectCategory(category: MenuItem['category'] | 'all'): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  onSelectPriceRange(range: PriceRange): void {
    this.selectedPriceRange.set(range);
    this.currentPage.set(1);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages());
    this.currentPage.set(clamped);
  }

  onRefresh(event: RefresherCustomEvent): void {
    this.pendingRefresh = event;
    this.menu.load();
  }

  async onAddToCart(item: MenuItem): Promise<void> {
    this.cart.add(item);

    const toast = await this.toastCtrl.create({
      message: `Added ${item.name} to cart`,
      duration: 1500,
      position: 'bottom',
      color: 'success',
    });

    await toast.present();
  }

  /** "Buy" — add the item then go straight to checkout, for the one-tap
   * path when the shopper already knows what they want. */
  onBuyNow(item: MenuItem): void {
    this.cart.add(item);
    this.router.navigateByUrl('/tabs/orders');
  }

  private matchesPriceRange(price: number, range: PriceRange): boolean {
    switch (range) {
      case 'under-50':
        return price < 50;
      case '50-100':
        return price >= 50 && price <= 100;
      case 'over-100':
        return price > 100;
      default:
        return true;
    }
  }
}
