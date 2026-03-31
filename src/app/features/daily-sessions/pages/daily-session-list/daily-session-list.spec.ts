import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailySessionList } from './daily-session-list';

describe('DailySessionList', () => {
  let component: DailySessionList;
  let fixture: ComponentFixture<DailySessionList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailySessionList],
    }).compileComponents();

    fixture = TestBed.createComponent(DailySessionList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
