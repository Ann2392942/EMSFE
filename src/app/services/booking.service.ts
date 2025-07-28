// src/app/services/booking.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface BookingRequest {
  userID: number;
  eventID: number;
  ticketCount: number;
}

export interface BookingStatusResponse {
  bookingStatus: string;
}

export interface BookingStatus {
  isBooked: boolean;
  ticketCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'https://localhost:7284/api/Booking';

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

  bookEvent(eventID: number, ticketCount: number): Observable<any> {
    const bookingRequest: BookingRequest = {
      userID: this.getCurrentUserId(),
      eventID: eventID,
      ticketCount: ticketCount
    };

    return this.http.post(`${this.apiUrl}/book`, bookingRequest, this.getHttpOptions());
  }

  // FIXED: Updated to use the correct API endpoint
  checkBookingStatus(eventID: number): Observable<BookingStatus> {
    const userID = this.getCurrentUserId();

    return this.http.get<BookingStatusResponse>(`${this.apiUrl}/check/${userID}/${eventID}`, this.getHttpOptions())
      .pipe(
        map((response: BookingStatusResponse) => ({
          isBooked: response.bookingStatus === 'Confirmed',
          ticketCount: 1 // You can modify this based on your API response
        })),
        catchError((error) => {
          // If 404, it means no booking exists
          if (error.status === 404) {
            return of({ isBooked: false, ticketCount: 0 });
          }
          throw error;
        })
      );
  }

  cancelBooking(eventID: number, ticketCount: number): Observable<any> {
    const cancelRequest: BookingRequest = {
      userID: this.getCurrentUserId(),
      eventID: eventID,
      ticketCount: ticketCount
    };

    return this.http.post(`${this.apiUrl}/cancel`, cancelRequest, this.getHttpOptions());
  }
}
