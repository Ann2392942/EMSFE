// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Auth routes (no guard needed)
  {
    path: 'auth',
    loadChildren: () => import('./components/auth/auth.routes').then(m => m.authRoutes)
  },

  // User routes (protected)
  {
    path: 'user',
    loadChildren: () => import('./components/user/user.routes').then(m => m.userRoutes),
    canActivate: [authGuard, roleGuard('User')]
  },

  // Organizer routes (protected)
  {
    path: 'organizer',
    loadChildren: () => import('./components/organizer/organizer.routes').then(m => m.organizerRoutes),
    canActivate: [authGuard, roleGuard('Admin')]
  },

  // Fallback route
  { path: '**', redirectTo: '/auth/login' }
];
