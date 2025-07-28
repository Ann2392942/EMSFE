// src/app/components/user/events/view-event/view-event.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../../services/event.service';
import { CategoryService, Category } from '../../../../services/category.service';
import { LocationService, Location } from '../../../../services/location.service';
import { BookingService } from '../../../../services/booking.service';
import { FeedbackService, Feedback, FeedbackRequest, FeedbackCheckResponse } from '../../../../services/feedback.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Event as EventModel } from '../../../../services/event.service';

@Component({
  selector: 'app-view-event',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-event.component.html',
  styleUrls: ['./view-event.component.css']
})
export class ViewEventComponent implements OnInit, OnDestroy {
  event: EventModel | null = null;
  category: Category | null = null;
  location: Location | null = null;
  eventId: number = 0;
  isLoading = false;
  errorMessage = '';
  isUserBooked = false;
  isCancelling = false;
  showCancelConfirmation = false;

  // Feedback properties
  feedbacks: Feedback[] = [];
  canGiveFeedback = false;
  hasGivenFeedback = false;
  feedbackCheckData: FeedbackCheckResponse | null = null;
  loadingFeedbacks = false;
  submittingFeedback = false;
  feedbackError = '';
  feedbackSuccess = '';
  isEventCompleted = false;
  ticketId = 0; // Will be set from API response

  // Feedback form
  feedbackForm: FeedbackRequest = {
    rating: 0,
    comments: ''
  };
  hoveredRating = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private categoryService: CategoryService,
    private locationService: LocationService,
    private bookingService: BookingService,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit() {
    this.eventId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    if (this.eventId) {
      this.loadEventDetails();
      this.loadFeedbacks();
      this.checkFeedbackEligibility();
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

        this.checkEventStatus();
        this.checkBookingStatus();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.errorMessage = 'Failed to load event details';
        this.isLoading = false;
      }
    });
  }

  checkEventStatus() {
    if (this.event) {
      const now = new Date();
      const eventEndDate = new Date(this.event.endDate);
      this.isEventCompleted = eventEndDate < now;
      console.log('Event completed status:', this.isEventCompleted);
    }
  }

  checkBookingStatus() {
    if (this.eventId) {
      this.bookingService.checkBookingStatus(this.eventId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (status) => {
            this.isUserBooked = status.isBooked;
            console.log(`Event ${this.eventId} booking status:`, status.isBooked);
          },
          error: (error) => {
            console.error(`Error checking booking status for event ${this.eventId}:`, error);
            this.isUserBooked = false;
          }
        });
    }
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

  // UPDATED: Use new API for checking feedback eligibility
  checkFeedbackEligibility() {
    this.feedbackService.checkFeedbackEligibility(this.eventId).subscribe({
      next: (response) => {
        console.log('Feedback eligibility check:', response);
        this.feedbackCheckData = response;
        this.hasGivenFeedback = response.hasGivenFeedback;
        this.canGiveFeedback = response.canGiveFeedback && this.isEventCompleted;
        this.ticketId = response.ticketId;

        console.log('Feedback status:', {
          hasGivenFeedback: this.hasGivenFeedback,
          canGiveFeedback: this.canGiveFeedback,
          isEventCompleted: this.isEventCompleted,
          ticketId: this.ticketId
        });
      },
      error: (error) => {
        console.error('Error checking feedback eligibility:', error);
        this.canGiveFeedback = false;
        this.hasGivenFeedback = false;
      }
    });
  }

  // UPDATED: Check if feedback section should be visible
  shouldShowFeedbackSection(): boolean {
    return this.isEventCompleted;
  }

  // UPDATED: Get feedback eligibility message based on API response
  getFeedbackEligibilityMessage(): string {
    if (!this.isEventCompleted) {
      return 'Reviews will be available after the event is completed.';
    }

    if (this.feedbackCheckData) {
      if (this.feedbackCheckData.hasGivenFeedback) {
        return 'Thank you! You have already submitted a review for this event.';
      }

      if (!this.feedbackCheckData.canGiveFeedback) {
        return this.feedbackCheckData.message || 'You cannot submit feedback for this event.';
      }
    }

    return '';
  }

  // UPDATED: Get feedback eligibility alert class
  getFeedbackAlertClass(): string {
    if (!this.isEventCompleted) {
      return 'alert-info';
    }

    if (this.feedbackCheckData) {
      if (this.feedbackCheckData.hasGivenFeedback) {
        return 'alert-success';
      }

      if (!this.feedbackCheckData.canGiveFeedback) {
        return 'alert-warning';
      }
    }

    return 'alert-info';
  }

  // UPDATED: Use the ticket ID from API response
  submitFeedback() {
    if (!this.isFeedbackFormValid()) {
      this.feedbackError = 'Please provide a rating and comment';
      return;
    }

    if (!this.ticketId) {
      this.feedbackError = 'Unable to submit feedback. Ticket ID not found.';
      return;
    }

    this.submittingFeedback = true;
    this.feedbackError = '';

    this.feedbackService.addFeedback(this.ticketId, this.feedbackForm).subscribe({
      next: (response) => {
        this.feedbackSuccess = 'Feedback submitted successfully!';
        this.submittingFeedback = false;
        this.resetFeedbackForm();
        this.loadFeedbacks();
        // Update feedback eligibility after submission
        this.checkFeedbackEligibility();

        setTimeout(() => {
          this.feedbackSuccess = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.feedbackError = 'Failed to submit feedback. Please try again.';
        this.submittingFeedback = false;
      }
    });
  }

  isFeedbackFormValid(): boolean {
    return this.feedbackForm.rating > 0 && this.feedbackForm.comments.trim().length > 0;
  }

  resetFeedbackForm() {
    this.feedbackForm = {
      rating: 0,
      comments: ''
    };
    this.hoveredRating = 0;
  }

  setRating(rating: number) {
    this.feedbackForm.rating = rating;
  }

  setHoveredRating(rating: number) {
    this.hoveredRating = rating;
  }

  clearHoveredRating() {
    this.hoveredRating = 0;
  }

  getStarClass(starNumber: number): string {
    const rating = this.hoveredRating || this.feedbackForm.rating;
    return starNumber <= rating ? 'bi bi-star-fill text-warning' : 'bi bi-star text-muted';
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

  formatFeedbackDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Existing methods remain the same
  goBack() {
    this.router.navigate(['/user/events']);
  }

  bookEvent() {
    if (this.event && this.canBookEvent()) {
      this.router.navigate(['/user/events/book', this.eventId]);
    }
  }

  initiateCancelBooking() {
    if (!this.canCancelBooking()) {
      return;
    }
    this.showCancelConfirmation = true;
  }

  closeCancelConfirmation() {
    this.showCancelConfirmation = false;
  }

  confirmCancelBooking() {
    this.showCancelConfirmation = false;
    this.isCancelling = true;

    this.bookingService.cancelBooking(this.eventId, 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Booking cancelled for event ${this.eventId}`);
          this.isUserBooked = false;
          this.isCancelling = false;
          // Re-check feedback eligibility after cancellation
          this.checkFeedbackEligibility();
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.isCancelling = false;
          this.errorMessage = 'Failed to cancel booking. Please try again.';
        }
      });
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

  getAvailableSpots(): number {
    if (!this.event || !this.location) return 0;
    return Math.max(0, this.location.capacity - this.event.bookedCapacity);
  }

  canBookEvent(): boolean {
    if (!this.event || this.isUserBooked) return false;

    const now = new Date();
    const endDate = new Date(this.event.endDate);

    return endDate > now && this.getAvailableSpots() > 0;
  }

  canCancelBooking(): boolean {
    if (!this.isUserBooked || !this.event) return false;

    const now = new Date();
    const endDate = new Date(this.event.endDate);

    return endDate > now;
  }

  getBookButtonText(): string {
    if (this.isUserBooked) return 'Already Booked';
    if (!this.event) return 'Not Available';

    const now = new Date();
    const endDate = new Date(this.event.endDate);

    if (endDate < now) return 'Event Ended';
    if (this.getAvailableSpots() === 0) return 'Sold Out';

    return 'Book Now';
  }

  getBookingPercentage(): number {
    if (!this.event || !this.location) return 0;
    return Math.round((this.event.bookedCapacity / this.location.capacity) * 100);
  }

  getBookingStatusMessage(): string {
    if (!this.isUserBooked) return '';

    const now = new Date();
    const endDate = new Date(this.event?.endDate || '');

    if (endDate < now) {
      return 'You attended this event. Cancellation is no longer available.';
    }

    return 'You have successfully booked this event.';
  }
}
