// src/app/components/organizer/events/view-event/view-event.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../../services/event.service';
import { CategoryService, Category } from '../../../../services/category.service';
import { LocationService, Location } from '../../../../services/location.service';
import { FeedbackService, Feedback } from '../../../../services/feedback.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Event as EventModel } from '../../../../services/event.service';

@Component({
  selector: 'app-organizer-view-event',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-event.component.html',
  styleUrls: ['./view-event.component.css']
})
export class OrganizerViewEventComponent implements OnInit, OnDestroy {
  event: EventModel | null = null;
  category: Category | null = null;
  location: Location | null = null;
  eventId: number = 0;
  isLoading = false;
  errorMessage = '';

  // Feedback properties
  feedbacks: Feedback[] = [];
  loadingFeedbacks = false;
  feedbackError = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private categoryService: CategoryService,
    private locationService: LocationService,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit() {
    this.eventId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    if (this.eventId) {
      this.loadEventDetails();
      this.loadFeedbacks();
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
      categories: this.categoryService.getCategories(),
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

        this.category = data.categories.find(c => c.categoryID === this.event!.categoryID) || null;
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

  loadFeedbacks() {
    this.loadingFeedbacks = true;
    this.feedbackService.getEventFeedbacks(this.eventId).subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks;
        this.loadingFeedbacks = false;
      },
      error: (error) => {
        console.error('Error loading feedbacks:', error);
        this.feedbackError = 'Failed to load reviews';
        this.loadingFeedbacks = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/organizer/events']);
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

  formatFeedbackDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDisplayStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 'bi bi-star-fill text-warning' : 'bi bi-star text-muted');
    }
    return stars;
  }

  getAverageRating(): number {
    if (this.feedbacks.length === 0) return 0;
    const sum = this.feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return Math.round((sum / this.feedbacks.length) * 10) / 10;
  }

  getEventStatus(): string {
    if (!this.event) return '';

    const now = new Date();
    const startDate = new Date(this.event.startDate);
    const endDate = new Date(this.event.endDate);

    if (now < startDate) {
      return 'Upcoming';
    } else if (now >= startDate && now <= endDate) {
      return 'Ongoing';
    } else {
      return 'Completed';
    }
  }

  getAvailableSpots(): number {
    if (!this.event || !this.location) return 0;
    return Math.max(0, this.location.capacity - this.event.bookedCapacity);
  }

  getBookingPercentage(): number {
    if (!this.event || !this.location) return 0;
    return Math.round((this.event.bookedCapacity / this.location.capacity) * 100);
  }

  // Feedback statistics
  getFeedbackStats() {
    if (this.feedbacks.length === 0) {
      return {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0,
        terrible: 0
      };
    }

    const stats = {
      excellent: this.feedbacks.filter(f => f.rating === 5).length,
      good: this.feedbacks.filter(f => f.rating === 4).length,
      average: this.feedbacks.filter(f => f.rating === 3).length,
      poor: this.feedbacks.filter(f => f.rating === 2).length,
      terrible: this.feedbacks.filter(f => f.rating === 1).length
    };

    return stats;
  }

  getRatingPercentage(count: number): number {
    if (this.feedbacks.length === 0) return 0;
    return Math.round((count / this.feedbacks.length) * 100);
  }
  // Add these methods to the existing view-event.component.ts

// Revenue calculations
getTotalRevenue(): number {
  if (!this.event || !this.event.isPrice) return 0;
  return this.event.price * this.event.bookedCapacity;
}

getPotentialRevenue(): number {
  if (!this.event || !this.event.isPrice || !this.location) return 0;
  return this.event.price * this.location.capacity;
}

// Event duration calculations
getEventDurationDays(): number {
  if (!this.event) return 0;
  const start = new Date(this.event.startDate);
  const end = new Date(this.event.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

getEventDurationHours(): number {
  if (!this.event) return 0;
  const start = new Date(this.event.startDate);
  const end = new Date(this.event.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60));
}

getDaysUntilEvent(): number {
  if (!this.event) return 0;
  const now = new Date();
  const eventStart = new Date(this.event.startDate);
  const diffTime = eventStart.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Feedback participation rate
getFeedbackParticipationRate(): number {
  if (!this.event || this.event.bookedCapacity === 0) return 0;
  return Math.round((this.feedbacks.length / this.event.bookedCapacity) * 100);
}

}
