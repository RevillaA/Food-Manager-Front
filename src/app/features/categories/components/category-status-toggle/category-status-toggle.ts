import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-status-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-status-toggle.html',
  styleUrl: './category-status-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryStatusToggle {
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