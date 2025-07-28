// src/app/components/user/user.routes.ts
import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user.component').then(c => c.UserComponent),
    children: [
      { path: '', redirectTo: 'events', pathMatch: 'full' },
      {
        path: 'events',
        loadComponent: () => import('./events/events.component').then(c => c.EventsComponent)
      },
      {
        path: 'events/book/:id',
        loadComponent: () => import('./events/book-event/book-event.component').then(c => c.BookEventComponent)
      },
      {
        path: 'events/:id',
        loadComponent: () => import('./events/view-event/view-event.component').then(c => c.ViewEventComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./tickets/tickets.component').then(c => c.TicketsComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('./tickets/view-ticket/view-ticket.component').then(c => c.ViewTicketComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(c => c.ProfileComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.component').then(c => c.NotificationsComponent)
      }
    ]
  }
];
