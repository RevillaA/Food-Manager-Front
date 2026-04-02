import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductStatusToggle } from './product-status-toggle';

describe('ProductStatusToggle', () => {
  let component: ProductStatusToggle;
  let fixture: ComponentFixture<ProductStatusToggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductStatusToggle],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductStatusToggle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
