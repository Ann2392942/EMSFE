import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { eventOwnerGuard } from './event-owner.guard';

describe('eventOwnerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => eventOwnerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
