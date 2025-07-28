// src/app/components/organizer/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventService, Event } from '../../../services/event.service';
import { CategoryService, Category } from '../../../services/category.service';
import { LocationService, Location } from '../../../services/location.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  draftEvents: number;
  totalLocations: number;
  totalCategories: number;
  totalCapacity: number;
  totalBookings: number;
  revenueThisMonth: number;
  avgEventDuration: number;
}

interface EventAnalytics {
  eventsThisMonth: number;
  eventsLastMonth: number;
  growthPercentage: number;
  popularCategory: string;
  popularLocation: string;
  avgTicketPrice: number;
}

interface RecentActivity {
  type: 'event' | 'location' | 'category';
  action: 'created' | 'updated' | 'completed';
  title: string;
  date: Date;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  events: Event[] = [];
  categories: Category[] = [];
  locations: Location[] = [];
  currentUser: any = null;
  isLoading = false;
  errorMessage = '';

  stats: DashboardStats = {
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    draftEvents: 0,
    totalLocations: 0,
    totalCategories: 0,
    totalCapacity: 0,
    totalBookings: 0,
    revenueThisMonth: 0,
    avgEventDuration: 0
  };

  analytics: EventAnalytics = {
    eventsThisMonth: 0,
    eventsLastMonth: 0,
    growthPercentage: 0,
    popularCategory: '',
    popularLocation: '',
    avgTicketPrice: 0
  };

  recentActivities: RecentActivity[] = [];
  upcomingEventsList: Event[] = [];
  categoryDistribution: { name: string; count: number; percentage: number; color: string }[] = [];
  monthlyData: { month: string; events: number; revenue: number }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private categoryService: CategoryService,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  getActivityClass(color: string): string {
  return `bg-${color}`;
}

getCapitalizedText(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

getBadgeClass(status: string): string {
  return `bg-${this.getStatusColor(status)}`;
}

getEventDay(dateString: string): string {
  return new Date(dateString).getDate().toString().padStart(2, '0');
}

getEventMonth(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', { month: 'short' }).toUpperCase();
}
  // Helper methods to avoid complex template expressions
  getLocationName(locationId: number): string {
    const location = this.locations.find(l => l.locationID === locationId);
    return location ? location.locationName : 'Unknown';
  }

  getLocationCapacity(locationId: number): number {
    const location = this.locations.find(l => l.locationID === locationId);
    return location ? location.capacity : 0;
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.categoryID === categoryId);
    return category ? category.categoryName : 'Unknown';
  }

  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      events: this.eventService.getAllEvents(),
      categories: this.categoryService.getCategories(),
      locations: this.locationService.getLocations()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.events = data.events;
        this.categories = data.categories;
        this.locations = data.locations;

        this.calculateStats();
        this.calculateAnalytics();
        this.generateRecentActivities();
        this.prepareUpcomingEvents();
        this.calculateCategoryDistribution();
        this.generateMonthlyData();

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  calculateStats() {
    const now = new Date();

    this.stats.totalEvents = this.events.length;
    this.stats.activeEvents = this.events.filter(e => e.isActive).length;
    this.stats.upcomingEvents = this.events.filter(e =>
      e.isActive && new Date(e.startDate) > now
    ).length;
    this.stats.completedEvents = this.events.filter(e =>
      new Date(e.endDate) < now
    ).length;
    this.stats.draftEvents = this.events.filter(e => !e.isActive).length;
    this.stats.totalLocations = this.locations.length;
    this.stats.totalCategories = this.categories.length;
    this.stats.totalCapacity = this.locations.reduce((sum, loc) => sum + loc.capacity, 0);
    this.stats.totalBookings = this.events.reduce((sum, event) => sum + event.bookedCapacity, 0);
    this.stats.revenueThisMonth = this.events
      .filter(e => e.isPrice && new Date(e.startDate).getMonth() === now.getMonth())
      .reduce((sum, event) => sum + (event.price * event.bookedCapacity), 0);

    const durations = this.events.map(e => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    });
    this.stats.avgEventDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
  }

  calculateAnalytics() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    this.analytics.eventsThisMonth = this.events.filter(e => {
      const eventDate = new Date(e.startDate);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;

    this.analytics.eventsLastMonth = this.events.filter(e => {
      const eventDate = new Date(e.startDate);
      return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
    }).length;

    this.analytics.growthPercentage = this.analytics.eventsLastMonth > 0
      ? Math.round(((this.analytics.eventsThisMonth - this.analytics.eventsLastMonth) / this.analytics.eventsLastMonth) * 100)
      : this.analytics.eventsThisMonth > 0 ? 100 : 0;

    const categoryCount = this.events.reduce((acc, event) => {
      acc[event.categoryID] = (acc[event.categoryID] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const popularCategoryId = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[+a] > categoryCount[+b] ? a : b, '0');
    this.analytics.popularCategory = this.categories.find(c => c.categoryID === +popularCategoryId)?.categoryName || 'N/A';

    const locationCount = this.events.reduce((acc, event) => {
      acc[event.locationID] = (acc[event.locationID] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    const popularLocationId = Object.keys(locationCount).reduce((a, b) =>
      locationCount[+a] > locationCount[+b] ? a : b, '0');
    this.analytics.popularLocation = this.locations.find(l => l.locationID === +popularLocationId)?.locationName || 'N/A';

    const paidEvents = this.events.filter(e => e.isPrice);
    this.analytics.avgTicketPrice = paidEvents.length > 0
      ? paidEvents.reduce((sum, event) => sum + event.price, 0) / paidEvents.length
      : 0;
  }

  generateRecentActivities() {
    const activities: RecentActivity[] = [];

    this.events.slice(0, 3).forEach(event => {
      const isUpcoming = new Date(event.startDate) > new Date();
      activities.push({
        type: 'event',
        action: isUpcoming ? 'created' : 'completed',
        title: event.name,
        date: new Date(event.startDate),
        icon: isUpcoming ? 'bi-plus-circle' : 'bi-check-circle',
        color: isUpcoming ? 'success' : 'primary'
      });
    });

    this.locations.slice(0, 2).forEach(location => {
      activities.push({
        type: 'location',
        action: 'created',
        title: `${location.locationName} venue added`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        icon: 'bi-geo-alt',
        color: 'info'
      });
    });

    this.recentActivities = activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }

  prepareUpcomingEvents() {
    const now = new Date();
    this.upcomingEventsList = this.events
      .filter(e => e.isActive && new Date(e.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  }

  calculateCategoryDistribution() {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const categoryCount = this.events.reduce((acc, event) => {
      acc[event.categoryID] = (acc[event.categoryID] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    this.categoryDistribution = Object.entries(categoryCount)
      .map(([categoryId, count], index) => {
        const category = this.categories.find(c => c.categoryID === +categoryId);
        return {
          name: category?.categoryName || 'Unknown',
          count,
          percentage: Math.round((count / this.events.length) * 100),
          color: colors[index % colors.length]
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  generateMonthlyData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyStats: { [key: string]: { events: number; revenue: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyStats[monthKey] = { events: 0, revenue: 0 };
    }

    this.events.forEach(event => {
      const eventDate = new Date(event.startDate);
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].events++;
        if (event.isPrice) {
          monthlyStats[monthKey].revenue += event.price * event.bookedCapacity;
        }
      }
    });

    this.monthlyData = Object.entries(monthlyStats).map(([key, data]) => {
      const [year, month] = key.split('-');
      return {
        month: months[+month],
        events: data.events,
        revenue: data.revenue
      };
    });
  }

  // Navigation methods
  navigateToEvents() {
    this.router.navigate(['/organizer/events']);
  }

  navigateToLocations() {
    this.router.navigate(['/organizer/locations']);
  }

  navigateToCategories() {
    this.router.navigate(['/organizer/categories']);
  }

  createEvent() {
    this.router.navigate(['/organizer/events/create']);
  }

  viewEvent(eventId: number) {
    this.router.navigate(['/organizer/events/view', eventId]);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEventStatus(event: Event): string {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (!event.isActive) return 'Draft';
    if (endDate < now) return 'Completed';
    if (startDate > now) return 'Upcoming';
    return 'Ongoing';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Upcoming': return 'warning';
      case 'Ongoing': return 'success';
      case 'Completed': return 'secondary';
      case 'Draft': return 'danger';
      default: return 'secondary';
    }
  }

  refreshDashboard() {
    this.currentDate = new Date();
    this.loadDashboardData();
  }
}
