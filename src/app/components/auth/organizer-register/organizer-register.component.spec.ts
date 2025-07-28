import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerRegisterComponent } from './organizer-register.component';

describe('OrganizerRegisterComponent', () => {
  let component: OrganizerRegisterComponent;
  let fixture: ComponentFixture<OrganizerRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizerRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
