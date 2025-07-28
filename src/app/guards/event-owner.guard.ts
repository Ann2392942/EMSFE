// src/app/guards/event-owner.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EventService } from '../services/event.service';

@Injectable({
  providedIn: 'root'
})
export class EventOwnerGuard implements CanActivate {
  constructor(
    private eventService: EventService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const eventId = parseInt(route.params['id']);

    if (!eventId) {
      this.router.navigate(['/organizer/events']);
      return of(false);
    }

    return this.eventService.getEventById(eventId).pipe(
      map(() => true), // If successful, user owns the event
      catchError(() => {
        // If error (unauthorized), redirect to events list
        this.router.navigate(['/organizer/events']);
        return of(false);
      })
    );
  }
}
