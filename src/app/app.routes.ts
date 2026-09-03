import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then(
        (m) => m.HomePage
      ),
  },

  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/menu.page').then(
        (m) => m.MenuPage
      ),
  },

  {
    path: 'cart',
    loadComponent: () =>
      import('./features/cart/cart.page').then(
        (m) => m.CartPage
      ),
  },

  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/orders.page').then(
        (m) => m.OrderPage
      ),
  },

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];