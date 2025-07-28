// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface AuthResponse {
  message: string;
  token: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  role: string;
}

export interface AdminRegisterRequest {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7284/api';
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';
  private emailKey = 'user_email';

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  // User Login
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/users/login`, credentials, this.getHttpOptions())
      .pipe(
        tap(response => this.handleAuthSuccess(response, credentials.email))
      );
  }

  // User Registration - Fixed method name and interface
  register(userData: any): Observable<any> {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      contactNumber: userData.phoneNumber || userData.contactNumber,
      role: "User"
    };

    return this.http.post(`${this.apiUrl}/users/register-user`, payload, this.getHttpOptions());
  }

  // User Registration (alternative method name for clarity)
  registerUser(userData: UserRegisterRequest): Observable<any> {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      contactNumber: userData.contactNumber,
      role: "User"
    };

    return this.http.post(`${this.apiUrl}/users/register-user`, payload, this.getHttpOptions());
  }

  // Admin Registration - Fixed interface
  registerAdmin(userData: any): Observable<any> {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      contactNumber: userData.phoneNumber || userData.contactNumber,
      role: "Admin"
    };

    return this.http.post(`${this.apiUrl}/users/register-admin`, payload, this.getHttpOptions());
  }

  // Handle successful authentication
  private handleAuthSuccess(response: AuthResponse, email: string): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.roleKey, response.role);
    localStorage.setItem(this.emailKey, email);

    this.currentUserSubject.next({
      email: email,
      role: response.role,
      token: response.token
    });
  }

  // Load user from localStorage
  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    const role = localStorage.getItem(this.roleKey);
    const email = localStorage.getItem(this.emailKey);

    if (token && role && email) {
      this.currentUserSubject.next({
        email: email,
        role: role,
        token: token
      });
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in - Fixed method name
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Alternative method name for compatibility
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  // Get user role
  getUserRole(): string {
    return localStorage.getItem(this.roleKey) || '';
  }

  // Get token
  getToken(): string {
    return localStorage.getItem(this.tokenKey) || '';
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.emailKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}
