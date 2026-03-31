import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-status-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-status-toggle.html',
  styleUrl: './user-status-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStatusToggle {
  readonly isActive = input<boolean>(true);
  readonly disabled = input<boolean>(false);

  @Output() toggled = new EventEmitter<void>();

  handleClick(): void {
    if (this.disabled()) {
      return;
    }

    this.toggled.emit();
  }
}