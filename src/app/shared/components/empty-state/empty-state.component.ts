import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() icon = 'fast-food-outline';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
}
