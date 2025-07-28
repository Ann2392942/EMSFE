// src/app/components/user/notifications/notifications.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  loading = false;
  error = '';
  selectedFilter = 'all';

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading = true;
    this.error = '';

    this.notificationService.getUserNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.error = 'Failed to load notifications';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    switch (this.selectedFilter) {
      case 'booking':
        this.filteredNotifications = this.notifications.filter(n =>
          n.message.includes('confirmed') || n.message.includes('booking')
        );
        break;
      case 'cancellation':
        this.filteredNotifications = this.notifications.filter(n =>
          n.message.includes('cancelled')
        );
        break;
      default:
        this.filteredNotifications = [...this.notifications];
    }
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  formatFullDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
      return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  }

  getNotificationIcon(message: string): string {
    if (message.includes('confirmed')) {
      return 'bi bi-check-circle-fill text-success';
    } else if (message.includes('cancelled')) {
      return 'bi bi-x-circle-fill text-danger';
    }
    return 'bi bi-info-circle-fill text-primary';
  }

  getNotificationClass(message: string): string {
    if (message.includes('confirmed')) {
      return 'notification-success';
    } else if (message.includes('cancelled')) {
      return 'notification-danger';
    }
    return 'notification-info';
  }
}
