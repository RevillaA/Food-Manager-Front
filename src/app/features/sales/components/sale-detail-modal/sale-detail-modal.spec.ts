import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleDetailModal } from './sale-detail-modal';

describe('SaleDetailModal', () => {
  let component: SaleDetailModal;
  let fixture: ComponentFixture<SaleDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleDetailModal],
    }).compileComponents();

    fixture = TestBed.createComponent(SaleDetailModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
