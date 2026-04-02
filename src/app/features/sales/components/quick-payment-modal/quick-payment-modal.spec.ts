import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickPaymentModal } from './quick-payment-modal';

describe('QuickPaymentModal', () => {
  let component: QuickPaymentModal;
  let fixture: ComponentFixture<QuickPaymentModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickPaymentModal],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickPaymentModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
