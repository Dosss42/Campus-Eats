import { Injectable, signal, computed } from '@angular/core';

import { MenuItem } from '../models/menu-item.model';
import { CartLine } from '../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'campuseats-cart';

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

  add(item: MenuItem): void {
    this.lines.update((lines) => {
      const existing = lines.find(
        (line) => line.item.id === item.id
      );

      if (existing) {
        return lines.map((line) =>
          line.item.id === item.id
            ? {
                ...line,
                quantity: line.quantity + 1,
              }
            : line
        );
      }

      return [
        ...lines,
        {
          item,
          quantity: 1,
        },
      ];
    });

    this.saveToStorage();
  }

  remove(itemId: number): void {
    this.lines.update((lines) =>
      lines
        .map((line) =>
          line.item.id === itemId
            ? {
                ...line,
                quantity: line.quantity - 1,
              }
            : line
        )
        .filter((line) => line.quantity > 0)
    );

    this.saveToStorage();
  }

  clear(): void {
    this.lines.set([]);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.lines())
    );
  }

  private loadFromStorage(): CartLine[] {
    const saved = localStorage.getItem(this.storageKey);

    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as CartLine[];
    } catch {
      return [];
    }
  }
}