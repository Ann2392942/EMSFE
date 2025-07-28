// src/app/guards/organizer.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const organizerGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Fixed: Use correct method name
  if (authService.isAuthenticated()) {
    const userRole = authService.getUserRole();
    if (userRole === 'Admin') {
      return true;
    } else {
      router.navigate(['/user/events']);
      return false;
    }
  }

  router.navigate(['/auth/login']);
  return false;
};
