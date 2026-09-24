import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonChip,
  IonLabel,
} from '@ionic/angular';

import { MenuItem } from '../../../core/models/menu-item.model';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel,
  ],
  templateUrl: './food-card.component.html',
  styleUrl: './food-card.component.scss',
})
export class FoodCardComponent {

  @Input() item!: MenuItem;

  @Output() addToCart = new EventEmitter<MenuItem>();

  /** "Buy" — adds the item to the cart and takes the shopper straight to
   * checkout, for the one-tap path when they already know what they want. */
  @Output() buyNow = new EventEmitter<MenuItem>();

  onAddToCart(): void {
    this.addToCart.emit(this.item);
  }

  onBuyNow(): void {
    this.buyNow.emit(this.item);
  }
}
