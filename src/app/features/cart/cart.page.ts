import { Component, inject } from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular';

import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    RouterLink,
    EmptyStateComponent,
  ],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
})
export class CartPage {
  readonly cart = inject(CartService);

  readonly lines = this.cart.all;
  readonly count = this.cart.count;
  readonly total = this.cart.total;
}
