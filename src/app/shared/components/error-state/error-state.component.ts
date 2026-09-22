import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon, IonButton } from '@ionic/angular';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [IonIcon, IonButton],
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = "We couldn't load this.";

  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
