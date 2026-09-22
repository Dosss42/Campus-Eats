import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Order, NewOrder } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {

  private http = inject(HttpClient);

  private api = environment.apiUrl;

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

    this.http
      .get<Order[]>(`${this.api}/orders${environment.simulate}`)
      .subscribe({

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

  /**
   * Places the order and resolves with the created Order, or rejects on
   * failure. A Promise (rather than the fire-and-forget pattern `load()`
   * uses) lets the page drive its own loading indicator and toast around
   * a single request/response.
   */
  create(order: NewOrder): Promise<Order> {

    this.failed.set(false);

    const request$ = this.http
      .post<Order>(`${this.api}/orders${environment.simulate}`, order)
      .pipe(finalize(() => this.busy.set(false)));

    this.busy.set(true);

    return firstValueFrom(request$)
      .then((createdOrder) => {
        this.orders.update((orders) => [createdOrder, ...orders]);
        return createdOrder;
      })
      .catch((err) => {
        this.failed.set(true);
        throw err;
      });
  }

  /**
   * Optimistically removes an order from the local list (e.g. the user
   * tapped Cancel) without deleting it on the server yet. Returns the
   * removed order so the caller can offer Undo, or restore it with
   * `restoreLocally`.
   */
  removeLocally(orderId: string): Order | undefined {
    const removed = this.orders().find((order) => order.id === orderId);

    if (removed) {
      this.orders.update((orders) =>
        orders.filter((order) => order.id !== orderId)
      );
    }

    return removed;
  }

  /** Puts a previously `removeLocally`'d order back into the list. */
  restoreLocally(order: Order): void {
    this.orders.update((orders) => {
      if (orders.some((existing) => existing.id === order.id)) {
        return orders;
      }

      return [order, ...orders].sort(
        (a, b) =>
          new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
      );
    });
  }

  /** Actually deletes the order on the server (undo window has passed). */
  cancel(orderId: string): void {
    this.http.delete<void>(`${this.api}/orders/${orderId}`).subscribe({
      error: () => {
        this.failed.set(true);
      },
    });
  }
}
