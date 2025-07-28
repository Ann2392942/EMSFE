import { Routes } from '@angular/router';
import { OrganizerComponent } from './organizer.component';
import { organizerGuard } from '../../guards/organizer.guard';

export const organizerRoutes: Routes = [
  {
    path: '',
    component: OrganizerComponent,
    canActivate: [organizerGuard], // Add role-based guard
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'events',
        loadComponent: () => import('./events/events.component').then(c => c.OrganizerEventsComponent)
      },
      {
        path: 'events/create',
        loadComponent: () => import('./events/create-event/create-event.component').then(c => c.CreateEventComponent)
      },
      {
        path: 'events/edit/:id',
        loadComponent: () => import('./events/edit-event/edit-event.component').then(c => c.EditEventComponent)
      },
      {
        path: 'events/view/:id',
        loadComponent: () => import('./events/view-event/view-event.component').then(c => c.OrganizerViewEventComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then(c => c.CategoriesComponent)
      },
      {
        path: 'locations',
        loadComponent: () => import('./locations/locations.component').then(c => c.LocationsComponent)
      },
      {
        path: 'locations/create',
        loadComponent: () => import('./locations/create-location/create-location.component').then(c => c.CreateLocationComponent)
      },
      {
        path: 'locations/edit/:id',
        loadComponent: () => import('./locations/edit-location/edit-location.component').then(c => c.EditLocationComponent)
      },
      {
        path: 'locations/view/:id',
        loadComponent: () => import('./locations/view-location/view-location.component').then(c => c.ViewLocationComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports.component').then(c => c.ReportsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(c => c.OrganizerProfileComponent)
      }
    ]
  }
];
