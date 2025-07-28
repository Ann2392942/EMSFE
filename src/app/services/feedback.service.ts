// src/app/services/feedback.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Feedback {
  feedbackID: number;
  eventID: number;
  userID: number;
  userName: string;
  rating: number;
  comments: string;
  submittedTimestamp: string;
}

export interface FeedbackRequest {
  rating: number;
  comments: string;
}

export interface BookingCheckResponse {
  isBooked: boolean;
}

export interface FeedbackCheckResponse {
  userId: number;
  eventId: number;
  ticketId: number;
  hasGivenFeedback: boolean;
  canGiveFeedback: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'https://localhost:7284/api/Feedback';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  private getCurrentUserId(): number {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userIdClaim = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        return parseInt(userIdClaim) || 0;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    return 0;
  }

  getEventFeedbacks(eventId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/Get-feedbacks-by-eventid/${eventId}`, this.getHttpOptions());
  }

  addFeedback(ticketId: number, feedbackData: FeedbackRequest): Observable<any> {
    const userId = this.getCurrentUserId();
    return this.http.post(`${this.apiUrl}/Add-feedbacks-by-Ticketid?userid=${userId}&ticketid=${ticketId}`,
      feedbackData, this.getHttpOptions());
  }

  checkIfEventBooked(eventId: number): Observable<BookingCheckResponse> {
    const userId = this.getCurrentUserId();
    return this.http.get<BookingCheckResponse>(`${this.apiUrl}/is-event-booked/${userId}/${eventId}`, this.getHttpOptions());
  }

  // ADDED: New API for checking feedback eligibility
  checkFeedbackEligibility(eventId: number): Observable<FeedbackCheckResponse> {
    const userId = this.getCurrentUserId();
    return this.http.get<FeedbackCheckResponse>(`${this.apiUrl.replace('/api/Feedback', '')}/api/feedback-check/user/${userId}/event/${eventId}`, this.getHttpOptions());
  }
}
