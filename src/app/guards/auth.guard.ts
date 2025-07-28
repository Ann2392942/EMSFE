// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking authentication');

  if (authService.isLoggedIn()) {
    console.log('AuthGuard: User is logged in');
    return true;
  }

  console.log('AuthGuard: User not logged in, redirecting to login');
  router.navigate(['/auth/login']);
  return false;
};

export const roleGuard = (expectedRole: string) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log('RoleGuard: Checking role for:', expectedRole);

    if (!authService.isLoggedIn()) {
      console.log('RoleGuard: User not logged in');
      router.navigate(['/auth/login']);
      return false;
    }

    const userRole = authService.getUserRole();
    console.log('RoleGuard: User role is:', userRole);

    if (userRole === expectedRole) {
      console.log('RoleGuard: Role matches');
      return true;
    }

    console.log('RoleGuard: Role does not match, redirecting');
    // Redirect based on actual role
    if (userRole === 'Admin') {
      router.navigate(['/organizer/dashboard']);
    } else if (userRole === 'User') {
      router.navigate(['/user/events']);
    } else {
      router.navigate(['/auth/login']);
    }

    return false;
  };
};
