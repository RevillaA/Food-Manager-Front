import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-status-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-status-toggle.html',
  styleUrl: './product-status-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductStatusToggle {
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