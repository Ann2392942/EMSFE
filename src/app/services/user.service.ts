// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface UserDetails {
  userID: number;
  name: string;
  email: string;
  contactNumber: string;
  role: string;
}

export interface EditUserDetailsDto {
  name: string;
  contactNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // FIXED: Changed from /api/User to /api/users to match your working API
  private apiUrl = 'https://localhost:7284/api/users';

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

  getCurrentUserId(): number {
    const token = this.authService.getToken();
    console.log('Checking token for user ID...'); // Debug log

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload); // Debug log

        const userIdClaim = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        console.log('Found user ID claim:', userIdClaim); // Debug log

        const userId = parseInt(userIdClaim);
        console.log('Parsed user ID:', userId); // Debug log
        return userId || 0;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }

    console.log('No valid token or user ID found'); // Debug log
    return 0;
  }

  getUserDetails(): Observable<UserDetails> {
    const userId = this.getCurrentUserId();

    if (!userId || userId === 0) {
      return throwError(() => new Error('No valid user session found. Please login again.'));
    }

    console.log(`Attempting to fetch user details for ID: ${userId}`); // Debug log

    // FIXED: Updated endpoint to match your working API
    return this.http.get<UserDetails>(`${this.apiUrl}/details/${userId}`, this.getHttpOptions())
      .pipe(
        catchError((error) => {
          console.error('API Error:', error); // Debug log

          if (error.status === 404) {
            return throwError(() => new Error(`User account not found (ID: ${userId}).`));
          } else if (error.status === 0) {
            return throwError(() => new Error('Cannot connect to server. Please check your internet connection.'));
          } else if (error.status >= 500) {
            return throwError(() => new Error('Server error. Please try again later.'));
          }

          return throwError(() => new Error('Failed to load profile. Please try again.'));
        })
      );
  }

  updateUserDetails(data: EditUserDetailsDto): Observable<any> {
    const userId = this.getCurrentUserId();

    if (!userId || userId === 0) {
      return throwError(() => new Error('No valid user session found. Please login again.'));
    }

    console.log(`Updating user details for ID: ${userId}`, data); // Debug log

    // FIXED: Updated endpoint to match your working API
    return this.http.put(`${this.apiUrl}/edit-details/${userId}`, data, this.getHttpOptions())
      .pipe(
        catchError((error) => {
          console.error('Update Error:', error); // Debug log

          if (error.status === 404) {
            return throwError(() => new Error('User account not found. Cannot update profile.'));
          } else if (error.status === 400) {
            return throwError(() => new Error('Invalid data provided. Please check your input.'));
          }

          return throwError(() => new Error('Failed to update profile. Please try again.'));
        })
      );
  }
}
