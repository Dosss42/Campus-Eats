import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Haptics, NotificationType } from '@capacitor/haptics';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  LoadingController,
  ToastController,
} from '@ionic/angular';

import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { Order, OrderStatus } from '../../core/models/order.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { AccountButtonComponent } from '../../shared/components/account-button/account-button.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

const UNDO_WINDOW_MS = 4000;

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    ErrorStateComponent,
    AccountButtonComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrderPage implements OnInit {

  readonly orderService = inject(OrderService);

  readonly cart = inject(CartService);

  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  readonly orders = this.orderService.all;

  readonly loading = this.orderService.loading;

  readonly error = this.orderService.error;

  customerName = '';

  roomOrStall = '';

  notes = '';

  ngOnInit(): void {

    this.orderService.load();

  }

  async placeOrder(): Promise<void> {

    if (!this.customerName || !this.roomOrStall) {

      this.showToast('Please enter your name and room/stall.', 'warning');

      return;

    }

    if (this.cart.all().length === 0) {

      this.showToast('Your cart is empty.', 'warning');

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

    const loading = await this.loadingCtrl.create({
      message: 'Placing your order…',
    });

    await loading.present();

    try {

      const created = await this.orderService.create(order);

      this.customerName = '';
      this.roomOrStall = '';
      this.notes = '';
      this.cart.clear();

      await this.showToast(
        `Order ${created.reference} placed successfully.`,
        'success'
      );

      // Subtle confirmation on the one moment that matters most: a
      // successful order. Silently no-ops on platforms/browsers without
      // haptics support.
      Haptics.notification({ type: NotificationType.Success }).catch(
        () => undefined
      );

    } catch {

      await this.showToast('Could not reach the canteen.', 'danger');

    } finally {

      await loading.dismiss();

    }

  }

  async cancelOrder(order: Order): Promise<void> {

    const removed = this.orderService.removeLocally(order.id);

    if (!removed) {
      return;
    }

    let undone = false;

    const toast = await this.toastCtrl.create({
      message: `Order ${removed.reference} cancelled.`,
      duration: UNDO_WINDOW_MS,
      position: 'bottom',
      buttons: [
        {
          text: 'Undo',
          handler: () => {
            undone = true;
            this.orderService.restoreLocally(removed);
          },
        },
      ],
    });

    await toast.present();
    await toast.onDidDismiss();

    if (!undone) {
      this.orderService.cancel(removed.id);
    }

  }

  statusColor(status: OrderStatus): string {
    switch (status) {
      case 'pending':
        return 'medium';
      case 'preparing':
        return 'warning';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'primary';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });

    await toast.present();
  }
}
