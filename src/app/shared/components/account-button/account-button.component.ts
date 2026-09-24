import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonIcon,
  IonPopover,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  ToastController,
} from '@ionic/angular';

import { AuthService } from '../../../core/services/auth.service';

let nextTriggerId = 0;

/**
 * A single account icon shared by every header. Tapping it opens a small
 * dropdown with the one action that applies: "Log in" when signed out,
 * "Log out" when signed in. One place owns this so Menu/Cart/Orders don't
 * each re-implement it.
 */
@Component({
  selector: 'app-account-button',
  standalone: true,
  imports: [
    IonButton,
    IonIcon,
    IonPopover,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  ],
  templateUrl: './account-button.component.html',
})
export class AccountButtonComponent {
  readonly auth = inject(AuthService);

  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  /** Ionic's trigger-based popover matches by element id, so each
   * instance (Menu/Cart/Orders can all be in the DOM briefly during a
   * page transition) needs its own. */
  readonly triggerId = `account-trigger-${nextTriggerId++}`;

  goToLogin(): void {
    // Return to whatever page this was tapped from, instead of always
    // falling back to Orders.
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  async logout(): Promise<void> {
    this.auth.logout();

    const toast = await this.toastCtrl.create({
      message: 'Logged out',
      duration: 1500,
      position: 'bottom',
    });
    await toast.present();

    // Orders is guarded — if that's where this was tapped, leave before
    // the next navigation re-triggers the guard's own redirect to login.
    if (this.router.url.startsWith('/tabs/orders')) {
      this.router.navigateByUrl('/tabs/menu');
    }
  }
}
