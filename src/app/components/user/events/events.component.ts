// src/app/components/user/events/events.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CategoryService, Category } from '../../../services/category.service';
import { LocationService, Location } from '../../../services/location.service';
import { BookingService } from '../../../services/booking.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Event as EventModel } from '../../../services/event.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit, OnDestroy {
  // Data
  events: EventModel[] = [];
  categories: Category[] = [];
  locations: Location[] = [];
  userBookings: { [eventId: number]: boolean } = {};

  // Filters and Search
  searchTerm = '';
  selectedSort = 'date'; // ADDED: Sorting option

  // State
  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private categoryService: CategoryService,
    private locationService: LocationService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      events: this.eventService.getAllPublicEvents(),
      categories: this.categoryService.getCategories(),
      locations: this.locationService.getLocations()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.events = data.events.filter(event => event.isActive);
        this.categories = data.categories;
        this.locations = data.locations;
        this.checkUserBookings();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.errorMessage = 'Failed to load events. Please try again.';
        this.isLoading = false;
      }
    });
  }

  checkUserBookings() {
    this.events.forEach(event => {
      this.bookingService.checkBookingStatus(event.eventID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (status) => {
            this.userBookings[event.eventID] = status.isBooked;
          },
          error: (error) => {
            console.error(`Error checking booking status for event ${event.eventID}:`, error);
            this.userBookings[event.eventID] = false;
          }
        });
    });
  }

  get filteredEvents() {
    let filtered = this.events;

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    return this.sortEvents(filtered);
  }

  // ADDED: Sorting functionality
  sortEvents(events: EventModel[]): EventModel[] {
    return [...events].sort((a, b) => {
      switch (this.selectedSort) {
        case 'date':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'popularity':
          return b.bookedCapacity - a.bookedCapacity;
        default:
          return 0;
      }
    });
  }

  // ADDED: Set sorting option
  setSorting(sortOption: string) {
    this.selectedSort = sortOption;
  }

  viewEvent(eventId: number) {
    this.router.navigate(['/user/events', eventId]);
  }

  bookEvent(eventId: number) {
    this.router.navigate(['/user/events/book', eventId]);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.categoryID === categoryId);
    return category ? category.categoryName : 'Unknown';
  }

  getLocationName(locationId: number): string {
    const location = this.locations.find(l => l.locationID === locationId);
    return location ? location.locationName : 'Unknown';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  getAvailableSpots(event: EventModel): number {
    const location = this.locations.find(l => l.locationID === event.locationID);
    const capacity = location ? location.capacity : 0;
    return Math.max(0, capacity - event.bookedCapacity);
  }

  isEventBookable(event: EventModel): boolean {
    const now = new Date();
    const endDate = new Date(event.endDate);

    const isNotCompleted = endDate > now;
    const hasSpots = this.getAvailableSpots(event) > 0;
    const notAlreadyBooked = !this.userBookings[event.eventID];

    return isNotCompleted && hasSpots && notAlreadyBooked;
  }

  shouldShowBookButton(event: EventModel): boolean {
    return this.isEventBookable(event);
  }

  getBookButtonText(event: EventModel): string {
    if (this.userBookings[event.eventID]) return 'Already Booked';

    const now = new Date();
    const endDate = new Date(event.endDate);

    if (endDate < now) return 'Event Completed';
    if (this.getAvailableSpots(event) === 0) return 'Sold Out';

    return 'Book Now';
  }

  getEventStatusText(event: EventModel): string {
    if (this.userBookings[event.eventID]) {
      return 'You have booked this event';
    }

    const now = new Date();
    const endDate = new Date(event.endDate);

    if (endDate < now) return 'Event has ended';
    if (this.getAvailableSpots(event) === 0) return 'No tickets available';

    return `${this.getAvailableSpots(event)} tickets remaining`;
  }
}
