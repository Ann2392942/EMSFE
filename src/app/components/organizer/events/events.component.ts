// src/app/components/organizer/events/events.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService, Event } from '../../../services/event.service';
import { CategoryService, Category } from '../../../services/category.service';
import { LocationService, Location } from '../../../services/location.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-organizer-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class OrganizerEventsComponent implements OnInit, OnDestroy {
  // Data
  events: Event[] = [];
  categories: Category[] = [];
  locations: Location[] = [];

  // Filters
  searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedSort = 'date';

  // UI State
  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private categoryService: CategoryService,
    private locationService: LocationService,
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
      events: this.eventService.getOrganizerEvents(),
      categories: this.categoryService.getCategories(),
      locations: this.locationService.getLocations()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.events = data.events;
        this.categories = data.categories;
        this.locations = data.locations;
        this.isLoading = false;
        console.log(`Loaded ${this.events.length} events for organizer`);
      },
      error: (error) => {
        console.error('Error loading organizer events:', error);
        this.errorMessage = 'Failed to load your events. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get filteredEvents() {
    let filtered = [...this.events];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(event =>
        event.categoryID === parseInt(this.selectedCategory)
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(event => {
        const status = this.getEventStatus(event);
        return status.toLowerCase() === this.selectedStatus;
      });
    }

    // Apply sorting
    return this.sortEvents(filtered);
  }

  sortEvents(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
      switch (this.selectedSort) {
        case 'date':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'bookings':
          return b.bookedCapacity - a.bookedCapacity;
        case 'status':
          return this.getEventStatus(a).localeCompare(this.getEventStatus(b));
        default:
          return 0;
      }
    });
  }

  viewEvent(eventId: number) {
  this.router.navigate(['/organizer/events/view', eventId]);
}

  editEvent(eventId: number) {
    this.router.navigate(['/organizer/events/edit', eventId]);
  }

  createEvent() {
    this.router.navigate(['/organizer/events/create']);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.categoryID === categoryId);
    return category ? category.categoryName : 'Unknown';
  }

  getLocationName(locationId: number): string {
    const location = this.locations.find(l => l.locationID === locationId);
    return location ? location.locationName : 'Unknown';
  }

  getEventStatus(event: Event): string {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (endDate < now) return 'Completed';
    if (startDate > now) return 'Upcoming';
    return 'Ongoing';
  }

  getEventStatusClass(event: Event): string {
    const status = this.getEventStatus(event);
    switch(status) {
      case 'Upcoming': return 'badge bg-success';
      case 'Ongoing': return 'badge bg-warning text-dark';
      case 'Completed': return 'badge bg-secondary';
      default: return 'badge bg-primary';
    }
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

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLocationCapacity(locationId: number): number {
    const location = this.locations.find(l => l.locationID === locationId);
    return location ? location.capacity : 0;
  }

  getAvailableSpots(event: Event): number {
    const capacity = this.getLocationCapacity(event.locationID);
    return Math.max(0, capacity - event.bookedCapacity);
  }

  getBookingRate(event: Event): number {
    const capacity = this.getLocationCapacity(event.locationID);
    return capacity > 0 ? Math.round((event.bookedCapacity / capacity) * 100) : 0;
  }

  getTotalRevenue(event: Event): number {
    return event.isPrice ? event.price * event.bookedCapacity : 0;
  }

  getEventStats() {
    return {
      total: this.events.length,
      upcoming: this.events.filter(e => this.getEventStatus(e) === 'Upcoming').length,
      ongoing: this.events.filter(e => this.getEventStatus(e) === 'Ongoing').length,
      completed: this.events.filter(e => this.getEventStatus(e) === 'Completed').length,
      totalBookings: this.events.reduce((sum, e) => sum + e.bookedCapacity, 0),
      totalRevenue: this.events.reduce((sum, e) => sum + this.getTotalRevenue(e), 0)
    };
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedSort = 'date';
  }
}
