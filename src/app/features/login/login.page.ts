import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  ToastController,
} from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonText,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);

  email = 'student@campus.edu';
  password = 'ionic123';

  readonly submitting = signal(false);

  async signIn(): Promise<void> {
    if (!this.email || !this.password) {
      this.showError('Enter your email and password.');
      return;
    }

    this.submitting.set(true);

    try {
      await this.auth.login(this.email, this.password);

      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') ??
        '/tabs/orders';

      this.router.navigateByUrl(returnUrl);
    } catch {
      this.showError('Wrong email or password.');
    } finally {
      this.submitting.set(false);
    }
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'bottom',
    });

    toast.present();
  }
}
