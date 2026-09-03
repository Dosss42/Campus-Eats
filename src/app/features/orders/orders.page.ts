import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular';

import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    FormsModule,
  ],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrderPage implements OnInit {

  readonly orderService = inject(OrderService);

  readonly cart = inject(CartService);

  readonly orders = this.orderService.all;

  readonly loading = this.orderService.loading;

  readonly error = this.orderService.error;

  customerName = '';

  roomOrStall = '';

  notes = '';

  ngOnInit(): void {

    this.orderService.load();

  }

  placeOrder(): void {

    if (!this.customerName || !this.roomOrStall) {

      alert('Please enter your name and room/stall.');

      return;

    }

    if (this.cart.all().length === 0) {

      alert('Your cart is empty.');

      return;

    }

    const order = {

      customerName: this.customerName,

      roomOrStall: this.roomOrStall,

      notes: this.notes,

      lines: this.cart.all().map((line) => ({

        itemId: line.item.id,

        quantity: line.quantity,

      })),

    };

    this.orderService.create(order);

    alert('Order placed successfully!');

    this.customerName = '';

    this.roomOrStall = '';

    this.notes = '';

    this.cart.clear();

  }
}