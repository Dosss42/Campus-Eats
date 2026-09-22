import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.page').then((m) => m.LoginPage),
  },

  {
    path: 'tabs',
    loadComponent: () =>
      import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'menu',
        loadComponent: () =>
          import('./features/menu/menu.page').then((m) => m.MenuPage),
      },

      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/cart.page').then((m) => m.CartPage),
      },

      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.page').then(
            (m) => m.OrderPage
          ),
        canActivate: [authGuard],
      },

      {
        path: '',
        redirectTo: 'menu',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: '',
    redirectTo: 'tabs/menu',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'tabs/menu',
  },
];
