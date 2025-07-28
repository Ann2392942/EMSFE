import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService, Feedback, FeedbackRequest } from '../../../../services/feedback.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {
  @Input() eventId: number = 0;
  @Input() ticketId: number = 0;
  @Input() eventName: string = '';

  feedbacks: Feedback[] = [];
  canGiveFeedback = false;
  isEventBooked = false;
  loading = false;
  submitting = false;
  error = '';
  successMessage = '';

  // Feedback form
  feedbackForm: FeedbackRequest = {
    rating: 0,
    comments: ''
  };

  hoveredRating = 0;

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit() {
    if (this.eventId) {
      this.loadFeedbacks();
      this.checkBookingStatus();
    }
  }

  loadFeedbacks() {
    this.loading = true;
    this.feedbackService.getEventFeedbacks(this.eventId).subscribe({
      next: (feedbacks) => {
        this.feedbacks = feedbacks;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading feedbacks:', error);
        this.error = 'Failed to load feedbacks';
        this.loading = false;
      }
    });
  }

  checkBookingStatus() {
    this.feedbackService.checkIfEventBooked(this.eventId).subscribe({
      next: (response) => {
        this.isEventBooked = response.isBooked;
        if (this.isEventBooked) {
          this.checkIfCanGiveFeedback();
        }
      },
      error: (error) => {
        console.error('Error checking booking status:', error);
        this.isEventBooked = false;
      }
    });
  }

  checkIfCanGiveFeedback() {
    // Check if user has already given feedback
    const currentUserId = this.getCurrentUserId();
    const hasGivenFeedback = this.feedbacks.some(f => f.userID === currentUserId);
    this.canGiveFeedback = this.isEventBooked && !hasGivenFeedback;
  }

  getCurrentUserId(): number {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) || 0;
      } catch (error) {
        return 0;
      }
    }
    return 0;
  }

  submitFeedback() {
    if (!this.isFormValid()) {
      this.error = 'Please provide a rating and comment';
      return;
    }

    this.submitting = true;
    this.error = '';

    this.feedbackService.addFeedback(this.ticketId, this.feedbackForm).subscribe({
      next: (response) => {
        this.successMessage = 'Feedback submitted successfully!';
        this.submitting = false;
        this.resetForm();
        this.loadFeedbacks();
        this.canGiveFeedback = false;

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.error = 'Failed to submit feedback. Please try again.';
        this.submitting = false;
      }
    });
  }

  isFormValid(): boolean {
    return this.feedbackForm.rating > 0 && this.feedbackForm.comments.trim().length > 0;
  }

  resetForm() {
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAverageRating(): number {
    if (this.feedbacks.length === 0) return 0;
    const sum = this.feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return Math.round((sum / this.feedbacks.length) * 10) / 10;
  }
}
