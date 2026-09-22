import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  RefresherCustomEvent,
} from '@ionic/angular';

import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { FoodCardComponent } from '../../shared/components/food-card/food-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

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
    FoodCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './menu.page.html',
  styleUrl: './menu.page.scss',
})
export class MenuPage implements OnInit {

  readonly menu = inject(MenuService);
  readonly cart = inject(CartService);

  readonly searchTerm = signal('');

  readonly items = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.menu.all();
    }

    return this.menu.all().filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
    );
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
  }

  onRefresh(event: RefresherCustomEvent): void {
    this.pendingRefresh = event;
    this.menu.load();
  }
}
