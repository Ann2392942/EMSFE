// src/app/services/organizer-user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface OrganizerDetails {
  userID: number;
  name: string;
  email: string;
  contactNumber: string;
  role: string;
}

export interface EditOrganizerDetailsDto {
  name: string;
  contactNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizerUserService {
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

  getOrganizerDetails(): Observable<OrganizerDetails> {
    const userId = this.getCurrentUserId();

    if (!userId || userId === 0) {
      return throwError(() => new Error('No valid user session found. Please login again.'));
    }

    return this.http.get<OrganizerDetails>(`${this.apiUrl}/details/${userId}`, this.getHttpOptions())
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => new Error(`Organizer account not found (ID: ${userId}).`));
          } else if (error.status === 0) {
            return throwError(() => new Error('Cannot connect to server. Please check your internet connection.'));
          } else if (error.status >= 500) {
            return throwError(() => new Error('Server error. Please try again later.'));
          }

          return throwError(() => new Error('Failed to load profile. Please try again.'));
        })
      );
  }

  updateOrganizerDetails(data: EditOrganizerDetailsDto): Observable<any> {
    const userId = this.getCurrentUserId();

    if (!userId || userId === 0) {
      return throwError(() => new Error('No valid user session found. Please login again.'));
    }

    return this.http.put(`${this.apiUrl}/edit-details/${userId}`, data, this.getHttpOptions())
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return throwError(() => new Error('Organizer account not found. Cannot update profile.'));
          } else if (error.status === 400) {
            return throwError(() => new Error('Invalid data provided. Please check your input.'));
          }

          return throwError(() => new Error('Failed to update profile. Please try again.'));
        })
      );
  }
}
