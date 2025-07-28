// src/app/components/organizer/organizer.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-organizer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './organizer.component.html',
  styleUrls: ['./organizer.component.css']
})
export class OrganizerComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobile = false;
  currentUser: any = null;
  currentRoute = '';
  showQuickCreateMenu = false;

  menuItems = [
    {
      title: 'Dashboard',
      icon: 'bi bi-speedometer2',
      route: '/organizer/dashboard',
      badge: null
    },
    {
      title: 'Events',
      icon: 'bi bi-calendar-event',
      route: '/organizer/events',
      badge: null
    },
    {
      title: 'Categories',
      icon: 'bi bi-tags',
      route: '/organizer/categories',
      badge: null
    },
    {
      title: 'Locations',
      icon: 'bi bi-geo-alt',
      route: '/organizer/locations',
      badge: null
    },
    {
      title: 'Reports',
      icon: 'bi bi-graph-up',
      route: '/organizer/reports',
      badge: null
    },
    {
      title: 'Profile',
      icon: 'bi bi-person-circle',
      route: '/organizer/profile',
      badge: null
    }
  ];

  quickCreateOptions = [
    {
      title: 'New Event',
      icon: 'bi bi-calendar-plus',
      route: '/organizer/events/create',
      color: 'primary'
    },
    {
      title: 'New Category',
      icon: 'bi bi-tag-fill',
      route: '/organizer/categories',
      color: 'success'
    },
    {
      title: 'New Location',
      icon: 'bi bi-geo-alt-fill',
      route: '/organizer/locations/create',
      color: 'info'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.currentRoute = this.router.url;

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;

        if (this.isMobile) {
          this.isSidebarCollapsed = true;
        }
      });
  }

  // UPDATED: Better user name extraction
  loadCurrentUser() {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUser = {
          id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
          name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User',
          email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 'user@example.com',
          role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'Organizer'
        };
      } catch (error) {
        console.error('Error parsing token:', error);
        this.currentUser = {
          name: 'User',
          email: 'user@example.com',
          role: 'Organizer'
        };
      }
    }
  }

  // ADDED: Method to get display name
  getDisplayName(): string {
    return this.currentUser?.name || 'User';
  }

  // ADDED: Method to get user email
  getUserEmail(): string {
    return this.currentUser?.email || 'user@example.com';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.quick-create-dropdown')) {
      this.showQuickCreateMenu = false;
    }
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

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  toggleQuickCreate() {
    this.showQuickCreateMenu = !this.showQuickCreateMenu;
  }

  quickCreate(option: any) {
    this.showQuickCreateMenu = false;
    this.router.navigate([option.route]);
  }

  logout() {
    this.authService.logout();
  }
}
