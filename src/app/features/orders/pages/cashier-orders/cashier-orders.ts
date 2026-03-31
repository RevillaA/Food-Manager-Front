import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-cashier-orders',
  standalone: true,
  templateUrl: './cashier-orders.html',
  styleUrl: './cashier-orders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashierOrders {}