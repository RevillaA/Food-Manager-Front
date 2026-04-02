import { TestBed } from '@angular/core/testing';

import { DailySessions } from './daily-sessions';

describe('DailySessions', () => {
  let service: DailySessions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailySessions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
