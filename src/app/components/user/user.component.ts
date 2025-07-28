// src/app/components/user/user.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;
  currentUser: any = null;
  selectedItem = 'events';

  // Notification properties
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotificationDropdown = false;
  loadingNotifications = false;

  menuItems = [
    {
      title: 'Events',
      icon: 'bi bi-calendar-event',
      route: '/user/events',
      key: 'events'
    },
    {
      title: 'Tickets',
      icon: 'bi bi-ticket-perforated',
      route: '/user/tickets',
      key: 'tickets'
    },
    {
      title: 'Profile',
      icon: 'bi bi-person-circle',
      route: '/user/profile',
      key: 'profile'
    },
    {
      title: 'Notifications',
      icon: 'bi bi-bell',
      route: '/user/notifications',
      key: 'notifications'
    }
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadNotifications();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateSelectedItem(event.urlAfterRedirects);

        if (this.isMobile) {
          this.isSidebarCollapsed = true;
        }
      });
  }

  // Load notifications for header dropdown
  loadNotifications() {
    this.loadingNotifications = true;
    this.notificationService.getUserNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications.slice(0, 5); // Show only recent 5 in dropdown
        this.unreadCount = notifications.length; // You can modify this logic based on read/unread status
        this.loadingNotifications = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loadingNotifications = false;
      }
    });
  }

  // Toggle notification dropdown
  toggleNotificationDropdown() {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  // Navigate to notifications page
  viewAllNotifications() {
    this.showNotificationDropdown = false;
    this.selectItem('notifications');
  }

  // Format notification timestamp
  formatNotificationTime(timestamp: string): string {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
      return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  }

  // Get notification icon based on message content
  getNotificationIcon(message: string): string {
    if (message.includes('confirmed')) {
      return 'bi bi-check-circle text-success';
    } else if (message.includes('cancelled')) {
      return 'bi bi-x-circle text-danger';
    }
    return 'bi bi-info-circle text-primary';
  }

  // Close notification dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown')) {
      this.showNotificationDropdown = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 992;
    if (this.isMobile) {
      this.isSidebarCollapsed = true;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  selectItem(item: string) {
    this.selectedItem = item;
    console.log('Selected:', item);

    // Navigate to the appropriate route
    switch(item) {
      case 'events':
        this.router.navigate(['/user/events']);
        break;
      case 'tickets':
        this.router.navigate(['/user/tickets']);
        break;
      case 'profile':
        this.router.navigate(['/user/profile']);
        break;
      case 'notifications':
        this.router.navigate(['/user/notifications']);
        break;
    }
  }

  updateSelectedItem(url: string) {
    if (url.includes('/user/events')) {
      this.selectedItem = 'events';
    } else if (url.includes('/user/tickets')) {
      this.selectedItem = 'tickets';
    } else if (url.includes('/user/profile')) {
      this.selectedItem = 'profile';
    } else if (url.includes('/user/notifications')) {
      this.selectedItem = 'notifications';
    }
  }

  logout() {
    this.authService.logout();
  }
}
