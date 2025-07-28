// src/app/services/ticket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Ticket {
  ticketID: number;
  userID: number;
  userName: string;
  userEmail: string;
  userContactNumber: string;
  eventID: number;
  eventName: string;
  eventDescription: string;
  categoryName: string;
  locationName: string;
  locationAddress: string;
  locationCity: string;
  eventStartDate: string;
  eventEndDate: string;
  bookingDate: string;
  status: string;
  bookingStatus: string;
  ticketCount: number;
  eventPrice: number;
  isEventPaid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'https://localhost:7284/api/Ticket';

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

  getUserTickets(): Observable<Ticket[]> {
    const userId = this.getCurrentUserId();
    return this.http.get<Ticket[]>(`${this.apiUrl}/user/${userId}`, this.getHttpOptions());
  }

  getTicketById(ticketId: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${ticketId}`, this.getHttpOptions());
  }
}
