import { TestBed } from '@angular/core/testing';

import { OrganizerUserService } from './organizer-user.service';

describe('OrganizerUserService', () => {
  let service: OrganizerUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizerUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
