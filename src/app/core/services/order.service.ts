import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Order, NewOrder } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {

  private http = inject(HttpClient);

  private api = 'http://localhost:8000/api';

  private orders = signal<Order[]>([]);
  private busy = signal(false);
  private failed = signal(false);

  readonly all = this.orders.asReadonly();

  readonly loading = this.busy.asReadonly();

  readonly error = this.failed.asReadonly();

  readonly count = computed(() => this.orders().length);

  load(): void {

    this.busy.set(true);
    this.failed.set(false);

    this.http.get<Order[]>(`${this.api}/orders`).subscribe({

      next: (orders) => {

        this.orders.set(orders);

        this.busy.set(false);

      },

      error: () => {

        this.failed.set(true);

        this.busy.set(false);

      },

    });

  }

  create(order: NewOrder): void {

    this.http.post<Order>(
      `${this.api}/orders`,
      order
    ).subscribe({

      next: (createdOrder) => {

        this.orders.update((orders) => [
          createdOrder,
          ...orders,
        ]);

      },

      error: () => {

        this.failed.set(true);

      },

    });

  }
}