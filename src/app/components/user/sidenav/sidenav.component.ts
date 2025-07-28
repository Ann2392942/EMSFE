// src/app/components/user/sidenav/sidenav.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidenav" [class.collapsed]="isCollapsed">
      <div class="sidenav-content">
        <!-- Toggle Button -->
        <div class="sidenav-header">
          <button class="toggle-btn" (click)="toggleSidenav()">
            <i [class]="isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
          </button>
        </div>

        <!-- User Welcome Section -->
        <div class="user-welcome" *ngIf="!isCollapsed">
          <div class="welcome-card">
            <div class="welcome-icon">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="welcome-text">
              <div class="welcome-message">Welcome back,</div>
              <div class="user-name">Event Explorer</div>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="nav-menu">
          <div class="nav-section">
            <div class="nav-title" *ngIf="!isCollapsed">Navigation</div>

            <ul class="nav-list">
              <li class="nav-item">
                <a class="nav-link"
                   [class.active]="isRouteActive('/user/events')"
                   (click)="navigateTo('/user/events')"
                   [title]="isCollapsed ? 'Browse Events' : ''">
                  <i class="bi bi-calendar-event nav-icon"></i>
                  <span class="nav-text" *ngIf="!isCollapsed">Browse Events</span>
                  <div class="nav-indicator" *ngIf="isRouteActive('/user/events')"></div>
                </a>
              </li>

              <li class="nav-item">
                <a class="nav-link"
                   [class.active]="isRouteActive('/user/tickets')"
                   (click)="navigateTo('/user/tickets')"
                   [title]="isCollapsed ? 'My Tickets' : ''">
                  <i class="bi bi-ticket-perforated nav-icon"></i>
                  <span class="nav-text" *ngIf="!isCollapsed">My Tickets</span>
                  <span class="nav-badge" *ngIf="ticketCount > 0 && !isCollapsed">{{ ticketCount }}</span>
                  <div class="nav-indicator" *ngIf="isRouteActive('/user/tickets')"></div>
                </a>
              </li>

              <li class="nav-item">
                <a class="nav-link"
                   [class.active]="isRouteActive('/user/profile')"
                   (click)="navigateTo('/user/profile')"
                   [title]="isCollapsed ? 'My Profile' : ''">
                  <i class="bi bi-person-circle nav-icon"></i>
                  <span class="nav-text" *ngIf="!isCollapsed">My Profile</span>
                  <div class="nav-indicator" *ngIf="isRouteActive('/user/profile')"></div>
                </a>
              </li>

              <li class="nav-item">
                <a class="nav-link"
                   [class.active]="isRouteActive('/user/notifications')"
                   (click)="navigateTo('/user/notifications')"
                   [title]="isCollapsed ? 'Notifications' : ''">
                  <i class="bi bi-bell nav-icon"></i>
                  <span class="nav-text" *ngIf="!isCollapsed">Notifications</span>
                  <span class="nav-badge bg-danger" *ngIf="notificationCount > 0 && !isCollapsed">{{ notificationCount }}</span>
                  <div class="nav-indicator" *ngIf="isRouteActive('/user/notifications')"></div>
                </a>
              </li>
            </ul>
          </div>

          <!-- Quick Stats -->
          <div class="nav-section" *ngIf="!isCollapsed">
            <div class="nav-title">Quick Stats</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="bi bi-ticket-perforated"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ userStats.totalTickets }}</div>
                  <div class="stat-label">Tickets</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="bi bi-heart-fill"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ userStats.favorites }}</div>
                  <div class="stat-label">Favorites</div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <!-- Footer with Logout -->
        <div class="sidenav-footer">
          <button class="logout-btn" (click)="logout()" *ngIf="!isCollapsed">
            <i class="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
          <button class="logout-btn-small" (click)="logout()" *ngIf="isCollapsed" title="Logout">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidenav {
      position: fixed;
      top: 70px;
      left: 0;
      width: 280px;
      height: calc(100vh - 70px);
      background: white;
      border-right: 1px solid #e5e7eb;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      z-index: 1040;
      overflow: hidden;
      box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05);
    }

    .sidenav.collapsed {
      width: 70px;
    }

    .sidenav-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    /* Header with toggle */
    .sidenav-header {
      padding: 15px;
      border-bottom: 1px solid #f1f5f9;
      text-align: right;
    }

    .toggle-btn {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 50%;
      width: 35px;
      height: 35px;
      color: #667eea;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-btn:hover {
      background: #667eea;
      color: white;
      transform: scale(1.1);
    }

    /* User Welcome */
    .user-welcome {
      padding: 20px;
      background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
      margin: 15px;
      border-radius: 12px;
      border: 1px solid #e0e7ff;
    }

    .welcome-card {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .welcome-icon {
      font-size: 2.5rem;
      color: #667eea;
    }

    .welcome-message {
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 2px;
    }

    .user-name {
      font-size: 1rem;
      font-weight: 600;
      color: #2d3748;
    }

    /* Navigation */
    .nav-menu {
      flex: 1;
      padding: 20px 0;
    }

    .nav-section {
      margin-bottom: 30px;
    }

    .nav-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0 20px 10px 20px;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-item {
      margin-bottom: 5px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      color: #6b7280;
      text-decoration: none;
      position: relative;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .nav-link:hover {
      background: #f8fafc;
      color: #667eea;
      transform: translateX(5px);
    }

    .nav-link.active {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      color: #667eea;
      font-weight: 600;
    }

    .nav-icon {
      font-size: 1.2rem;
      margin-right: 15px;
      width: 24px;
      text-align: center;
    }

    .nav-text {
      flex: 1;
      font-size: 0.9rem;
    }

    .nav-badge {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 10px;
      font-weight: 600;
      color: white;
      background: #667eea;
    }

    .nav-badge.bg-danger {
      background: #ef4444 !important;
    }

    .nav-indicator {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 25px;
      background: #667eea;
      border-radius: 0 4px 4px 0;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 0 20px;
    }

    .stat-card {
      background: white;
      padding: 15px 10px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      text-align: center;
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      font-size: 1.5rem;
      color: #667eea;
      margin-bottom: 8px;
    }

    .stat-number {
      font-size: 1.3rem;
      font-weight: 700;
      color: #2d3748;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Footer */
    .sidenav-footer {
      padding: 20px;
      border-top: 1px solid #f1f5f9;
    }

    .logout-btn {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-weight: 600;
      width: 100%;
      cursor: pointer;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    }

    .logout-btn-small {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      transition: all 0.2s;
    }

    .logout-btn-small:hover {
      background: #dc2626;
      transform: scale(1.1);
    }

    /* Collapsed State */
    .sidenav.collapsed .sidenav-header {
      text-align: center;
    }

    .sidenav.collapsed .nav-link {
      justify-content: center;
      padding: 15px 10px;
    }

    .sidenav.collapsed .nav-icon {
      margin-right: 0;
    }

    /* Responsive */
    @media (max-width: 991.98px) {
      .sidenav {
        transform: translateX(-100%);
      }

      .sidenav.mobile-open {
        transform: translateX(0);
      }
    }

    /* Custom Scrollbar */
    .sidenav-content::-webkit-scrollbar {
      width: 6px;
    }

    .sidenav-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .sidenav-content::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }

    .sidenav-content::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
  `]
})
export class SidenavComponent implements OnInit {
  isCollapsed = false;
  currentRoute = '';

  // Mock data
  ticketCount = 3;
  notificationCount = 5;

  userStats = {
    totalTickets: 3,
    favorites: 12
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.currentRoute = this.router.url;
    console.log('Sidenav component loaded'); // Debug

    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
      });
  }

  toggleSidenav() {
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  logout() {
    console.log('Logout clicked from sidenav');
  }
}
