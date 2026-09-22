import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
} from '@ionic/angular';

import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
  ],
  templateUrl: './tabs.page.html',
  styleUrl: './tabs.page.scss',
})
export class TabsPage {
  readonly cart = inject(CartService);
}
