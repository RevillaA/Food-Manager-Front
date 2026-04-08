import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDetailModal } from './order-detail-modal';

describe('OrderDetailModal', () => {
  let component: OrderDetailModal;
  let fixture: ComponentFixture<OrderDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailModal],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
