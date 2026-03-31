import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserStatusToggle } from './user-status-toggle';

describe('UserStatusToggle', () => {
  let component: UserStatusToggle;
  let fixture: ComponentFixture<UserStatusToggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserStatusToggle],
    }).compileComponents();

    fixture = TestBed.createComponent(UserStatusToggle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
