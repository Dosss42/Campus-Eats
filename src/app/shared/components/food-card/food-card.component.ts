import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MenuItem } from '../../../core/models/menu-item.model';

@Component({
  selector: 'app-food-card',
  standalone: true,
  templateUrl: './food-card.component.html',
  styleUrl: './food-card.component.scss',
})
export class FoodCardComponent {

  @Input() item!: MenuItem;

  @Output() addToCart = new EventEmitter<MenuItem>();

  onAddToCart(): void {
    this.addToCart.emit(this.item);
  }
}