import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesList {}