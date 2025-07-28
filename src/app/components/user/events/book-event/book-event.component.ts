// src/app/components/user/events/book-event/book-event.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../../services/event.service';
import { LocationService, Location } from '../../../../services/location.service';
import { BookingService } from '../../../../services/booking.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Event as EventModel } from '../../../../services/event.service';

@Component({
  selector: 'app-book-event',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-event.component.html',
  styleUrls: ['./book-event.component.css']
})
export class BookEventComponent implements OnInit, OnDestroy {
  event: EventModel | null = null;
  location: Location | null = null;
  eventId: number = 0;
  ticketCount: number = 1;

  // States
  isLoading = false;
  errorMessage = '';
  isBooking = false;
  bookingComplete = false;

  // Payment form
  cardNumber = '';
  expiryDate = '';
  cvv = '';
  cardName = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private locationService: LocationService,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    this.eventId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    if (this.eventId) {
      this.loadEventDetails();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEventDetails() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      events: this.eventService.getAllPublicEvents(),
      locations: this.locationService.getLocations()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.event = data.events.find(e => e.eventID === this.eventId) || null;

        if (!this.event) {
          this.errorMessage = 'Event not found';
          this.isLoading = false;
          return;
        }

        this.location = data.locations.find(l => l.locationID === this.event!.locationID) || null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.errorMessage = 'Failed to load event details';
        this.isLoading = false;
      }
    });
  }

  getAvailableSpots(): number {
    if (!this.event || !this.location) return 0;
    return Math.max(0, this.location.capacity - this.event.bookedCapacity);
  }

  // FIXED: Added method to generate ticket options
  getTicketOptions(): number[] {
    const maxTickets = Math.min(10, this.getAvailableSpots());
    const options = [];
    for (let i = 1; i <= maxTickets; i++) {
      options.push(i);
    }
    return options;
  }

  getTotalPrice(): number {
    if (!this.event || !this.event.isPrice) return 0;
    return this.event.price * this.ticketCount;
  }

  canBook(): boolean {
    if (!this.event) return false;

    const now = new Date();
    const endDate = new Date(this.event.endDate);

    return endDate > now &&
           this.getAvailableSpots() >= this.ticketCount &&
           this.ticketCount > 0;
  }

  processPayment() {
    if (!this.canBook()) return;

    this.isBooking = true;

    // Simulate payment processing
    setTimeout(() => {
      this.bookingService.bookEvent(this.eventId, this.ticketCount)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Booking successful:', response);
            this.bookingComplete = true;
            this.isBooking = false;

            // Redirect after 3 seconds
            setTimeout(() => {
              this.router.navigate(['/user/tickets']);
            }, 3000);
          },
          error: (error) => {
            console.error('Booking failed:', error);
            this.errorMessage = 'Booking failed. Please try again.';
            this.isBooking = false;
          }
        });
    }, 2000); // Simulate 2 second payment processing
  }

  goBack() {
    this.router.navigate(['/user/events']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
