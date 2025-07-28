import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteTicketComponent } from './delete-ticket.component';

describe('DeleteTicketComponent', () => {
  let component: DeleteTicketComponent;
  let fixture: ComponentFixture<DeleteTicketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteTicketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
