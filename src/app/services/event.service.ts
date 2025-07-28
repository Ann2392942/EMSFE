// src/app/services/event.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Event {
  eventID: number;
  name: string;
  categoryID: number;
  locationID: number;
  startDate: string;
  endDate: string;
  userID: number;
  description: string;
  isPrice: boolean;
  price: number;
  isActive: boolean;
  bookedCapacity: number;
  feedbacks: any;
  notifications: any;
  payments: any;
  tickets: any;
}

export interface CreateEventRequest {
  eventID: 0;
  name: string;
  categoryID: number;
  locationID: number;
  startDate: string;
  endDate: string;
  userID: number;
  description: string;
  isPrice: boolean;
  price: number;
  isActive: boolean;
  bookedCapacity: 0;
}

export interface UpdateEventRequest {
  name: string;
  categoryID: number;
  locationID: number;
  startDate: string;
  endDate: string;
  userID: number;
  description: string;
  isPrice: boolean;
  price: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'https://localhost:7284/api/events';
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();

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

  // Get current user ID from auth service
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

  // Get all public events (for users to browse and book)
  getAllPublicEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/all`, this.getHttpOptions())
      .pipe(
        tap(events => this.eventsSubject.next(events))
      );
  }

  // ADDED: Get events created by current organizer only
  getOrganizerEvents(): Observable<Event[]> {
    const currentUserId = this.getCurrentUserId();
    return this.http.get<Event[]>(`${this.apiUrl}/all`, this.getHttpOptions())
      .pipe(
        map(events => events.filter(event => event.userID === currentUserId)),
        tap(filteredEvents => {
          console.log(`Organizer ${currentUserId} has ${filteredEvents.length} events`);
        })
      );
  }

  // Get all events (for backward compatibility)
  getAllEvents(): Observable<Event[]> {
    return this.getAllPublicEvents();
  }

  // Get event by ID
  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }

  // UPDATED: Get event by ID for organizer (check ownership)
  getOrganizerEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`, this.getHttpOptions())
      .pipe(
        map(event => {
          const currentUserId = this.getCurrentUserId();
          if (event.userID !== currentUserId) {
            throw new Error('Unauthorized: You can only view your own events');
          }
          return event;
        })
      );
  }

  // Create new event with current user ID
  createEvent(eventData: CreateEventRequest): Observable<Event> {
    const currentUserId = this.getCurrentUserId();
    const payload = {
      ...eventData,
      userID: currentUserId
    };

    return this.http.post<Event>(`${this.apiUrl}/create`, payload, this.getHttpOptions())
      .pipe(
        tap(() => this.refreshEvents())
      );
  }

  // Update existing event (using correct backend endpoint)
  updateEvent(id: number, eventData: UpdateEventRequest): Observable<any> {
    const currentUserId = this.getCurrentUserId();
    const payload = {
      name: eventData.name,
      categoryID: eventData.categoryID,
      locationID: eventData.locationID,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      userID: currentUserId,
      description: eventData.description,
      isPrice: eventData.isPrice,
      price: eventData.price,
      isActive: eventData.isActive
    };

    return this.http.put(`${this.apiUrl}/update/${id}`, payload, this.getHttpOptions())
      .pipe(
        tap(() => this.refreshEvents())
      );
  }

  // ADDED: Delete event (only if owned by organizer)
  deleteEvent(id: number): Observable<any> {
    const currentUserId = this.getCurrentUserId();

    // First verify the event belongs to the current user
    return this.getEventById(id).pipe(
      map(event => {
        if (event.userID !== currentUserId) {
          throw new Error('Unauthorized: You can only delete your own events');
        }
        return event;
      }),
      tap(() => {
        // If verification passes, proceed with deletion
        return this.http.delete(`${this.apiUrl}/${id}`, this.getHttpOptions());
      })
    );
  }

  // Check if event belongs to current user
  canAccessEvent(eventId: number): Observable<boolean> {
    return this.getOrganizerEventById(eventId).pipe(
      map(() => true)
    );
  }

  // ADDED: Check if user owns the event
  isEventOwner(eventId: number): Observable<boolean> {
    const currentUserId = this.getCurrentUserId();
    return this.getEventById(eventId).pipe(
      map(event => event.userID === currentUserId)
    );
  }

  // Get current user role
  getCurrentUserRole(): string {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'user';
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    return 'user';
  }

  // Check if current user is organizer
  isOrganizer(): boolean {
    return this.getCurrentUserRole().toLowerCase() === 'organizer';
  }

  // Refresh events list
  private refreshEvents(): void {
    if (this.isOrganizer()) {
      this.getOrganizerEvents().subscribe();
    } else {
      this.getAllPublicEvents().subscribe();
    }
  }

  // Get current events
  getCurrentEvents(): Event[] {
    return this.eventsSubject.value;
  }

  // ADDED: Get event statistics for organizer
  getOrganizerEventStats(): Observable<{
    total: number,
    upcoming: number,
    ongoing: number,
    completed: number,
    totalBookings: number,
    totalRevenue: number
  }> {
    return this.getOrganizerEvents().pipe(
      map(events => {
        const now = new Date();
        const stats = {
          total: events.length,
          upcoming: 0,
          ongoing: 0,
          completed: 0,
          totalBookings: 0,
          totalRevenue: 0
        };

        events.forEach(event => {
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);

          // Count event status
          if (endDate < now) {
            stats.completed++;
          } else if (startDate > now) {
            stats.upcoming++;
          } else {
            stats.ongoing++;
          }

          // Sum bookings and revenue
          stats.totalBookings += event.bookedCapacity;
          if (event.isPrice) {
            stats.totalRevenue += event.price * event.bookedCapacity;
          }
        });

        return stats;
      })
    );
  }
}
