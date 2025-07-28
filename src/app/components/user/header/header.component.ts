// src/app/components/user/header/header.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <nav class="user-header">
      <div class="header-container">
        <!-- Left Side -->
        <div class="header-left">
          <div class="brand">
            <i class="bi bi-calendar-event me-2"></i>
            EventHub
          </div>
        </div>

        <!-- Right Side -->
        <div class="header-right">
          <!-- Search -->
          <div class="search-container d-none d-md-flex">
            <i class="bi bi-search"></i>
            <input type="text"
                   placeholder="Search events..."
                   class="search-input"
                   [(ngModel)]="searchQuery"
                   (keyup.enter)="onSearch()">
          </div>

          <!-- Notifications -->
          <div class="dropdown">
            <button class="notification-btn"
                    type="button"
                    data-bs-toggle="dropdown">
              <i class="bi bi-bell"></i>
              <span class="notification-badge" *ngIf="notificationCount > 0">
                {{ notificationCount }}
              </span>
            </button>

            <ul class="dropdown-menu dropdown-menu-end notification-menu">
              <li class="dropdown-header">
                <div class="d-flex justify-content-between align-items-center w-100">
                  <span class="fw-semibold">Notifications</span>
                  <span class="badge bg-primary rounded-pill">{{ notificationCount }}</span>
                </div>
              </li>
              <li><hr class="dropdown-divider"></li>

              <!-- Notification Items -->
              <li *ngFor="let notification of notifications" class="notification-item">
                <a class="dropdown-item" href="#" [class.unread]="!notification.read">
                  <div class="notification-content">
                    <div class="notification-icon">
                      <i [class]="notification.icon" [ngClass]="notification.iconClass"></i>
                    </div>
                    <div class="notification-text">
                      <div class="notification-title">{{ notification.title }}</div>
                      <div class="notification-message">{{ notification.message }}</div>
                      <div class="notification-time">{{ notification.time }}</div>
                    </div>
                  </div>
                </a>
              </li>

              <li><hr class="dropdown-divider"></li>
              <li class="text-center">
                <a class="dropdown-item text-primary fw-semibold" (click)="viewAllNotifications()">
                  <i class="bi bi-eye me-2"></i>View All
                </a>
              </li>
            </ul>
          </div>

          <!-- User Menu -->
          <div class="dropdown">
            <button class="user-btn"
                    type="button"
                    data-bs-toggle="dropdown">
              <div class="user-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
              <div class="user-info d-none d-lg-block">
                <div class="user-name">User</div>
                <div class="user-role">Explorer</div>
              </div>
              <i class="bi bi-chevron-down ms-2 d-none d-lg-block"></i>
            </button>

            <ul class="dropdown-menu dropdown-menu-end user-menu">
              <li class="dropdown-header">
                <div class="user-profile-header">
                  <i class="bi bi-person-circle fs-2"></i>
                  <div class="ms-2">
                    <div class="fw-bold">User Name</div>
                    <small class="text-muted">userexample.com</small>
                  </div>
                </div>
              </li>
              <li><hr class="dropdown-divider"></li>

              <li>
                <a class="dropdown-item" (click)="navigateTo('/user/profile')">
                  <i class="bi bi-person me-3"></i>My Profile
                </a>
              </li>
              <li>
                <a class="dropdown-item" href="#">
                  <i class="bi bi-gear me-3"></i>Settings
                </a>
              </li>

              <li><hr class="dropdown-divider"></li>
              <li>
                <a class="dropdown-item text-danger" (click)="logout()">
                  <i class="bi bi-box-arrow-right me-3"></i>Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .user-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 70px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      z-index: 1050;
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
    }

    .header-container {
      width: 100%;
      padding: 0 25px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    /* Search */
    .search-container {
      position: relative;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 25px;
      padding: 8px 15px;
      display: flex;
      align-items: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .search-container:focus-within {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .search-container i {
      margin-right: 10px;
      color: rgba(255, 255, 255, 0.8);
    }

    .search-input {
      background: transparent;
      border: none;
      color: white;
      outline: none;
      width: 250px;
      font-size: 0.9rem;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    /* Notifications */
    .notification-btn {
      position: relative;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 50%;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }

    .notification-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateY(-1px);
    }

    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }

    .notification-menu {
      width: 380px;
      max-height: 450px;
      overflow-y: auto;
      border: none;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }

    .notification-item .dropdown-item {
      padding: 15px 20px;
      border-bottom: 1px solid #f1f5f9;
      white-space: normal;
    }

    .notification-item .dropdown-item.unread {
      background: #f8faff;
      border-left: 4px solid #667eea;
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .notification-icon {
      font-size: 1.3rem;
      margin-top: 2px;
    }

    .notification-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: #2d3748;
      margin-bottom: 4px;
    }

    .notification-message {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .notification-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* User Menu */
    .user-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 25px;
      padding: 6px 15px 6px 6px;
      color: white;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .user-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateY(-1px);
    }

    .user-avatar {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      font-size: 1.5rem;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .user-role {
      font-size: 0.7rem;
      opacity: 0.8;
      line-height: 1;
    }

    .user-menu {
      width: 280px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }

    .user-profile-header {
      display: flex;
      align-items: center;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-container {
        padding: 0 15px;
      }

      .brand {
        font-size: 1.3rem;
      }

      .search-input {
        width: 150px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  searchQuery = '';
  notificationCount = 4;

  notifications = [
    {
      id: 1,
      title: 'New Event Available',
      message: 'Tech Conference 2024 is now open for registration',
      time: '5 minutes ago',
      icon: 'bi bi-calendar-plus',
      iconClass: 'text-success',
      read: false
    },
    {
      id: 2,
      title: 'Booking Confirmed',
      message: 'Your ticket for Music Festival has been confirmed',
      time: '1 hour ago',
      icon: 'bi bi-check-circle',
      iconClass: 'text-primary',
      read: false
    },
    {
      id: 3,
      title: 'Event Reminder',
      message: 'Photography Workshop starts tomorrow at 10 AM',
      time: '3 hours ago',
      icon: 'bi bi-bell',
      iconClass: 'text-warning',
      read: false
    },
    {
      id: 4,
      title: 'Payment Received',
      message: 'Payment for Art Exhibition ticket received',
      time: '1 day ago',
      icon: 'bi bi-credit-card',
      iconClass: 'text-info',
      read: true
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.notificationCount = this.notifications.filter(n => !n.read).length;
    console.log('Header component loaded'); // Debug
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/user/events'], {
        queryParams: { search: this.searchQuery }
      });
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  viewAllNotifications() {
    this.router.navigate(['/user/notifications']);
  }

  logout() {
    console.log('Logout clicked');
  }
}
