import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryFormModal } from './category-form-modal';

describe('CategoryFormModal', () => {
  let component: CategoryFormModal;
  let fixture: ComponentFixture<CategoryFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFormModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
