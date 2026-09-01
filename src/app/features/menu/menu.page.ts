import { Component, OnInit, inject } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular';

import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-menu',
  standalone: true,

  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
  ],

  templateUrl: './menu.page.html',
  styleUrl: './menu.page.scss',
})
export class MenuPage implements OnInit {
  readonly menu = inject(MenuService);
  readonly cart = inject(CartService);

  readonly items = this.menu.all;

  ngOnInit(): void {
    this.menu.load();
  }
}