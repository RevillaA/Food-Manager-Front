import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryStatusToggle } from './category-status-toggle';

describe('CategoryStatusToggle', () => {
  let component: CategoryStatusToggle;
  let fixture: ComponentFixture<CategoryStatusToggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryStatusToggle],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryStatusToggle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
