import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';

import { ThemeService } from '../../../core/services/theme.service';

/** One icon, shared by every header, that flips light/dark mode. */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
