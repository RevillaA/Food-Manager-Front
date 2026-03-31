import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierOrders } from './cashier-orders';

describe('CashierOrders', () => {
  let component: CashierOrders;
  let fixture: ComponentFixture<CashierOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashierOrders],
    }).compileComponents();

    fixture = TestBed.createComponent(CashierOrders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
