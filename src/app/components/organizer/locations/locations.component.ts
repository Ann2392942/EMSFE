// src/app/components/organizer/locations/locations.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LocationService, Location } from '../../../services/location.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css']
})
export class LocationsComponent implements OnInit, OnDestroy {
  locations: Location[] = [];
  filteredLocations: Location[] = [];
  isLoading = false;
  errorMessage = '';

  // Filters
  searchTerm = '';
  selectedCapacityRange = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    private locationService: LocationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLocations();
    this.subscribeToLocations();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  subscribeToLocations() {
    this.locationService.locations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(locations => {
        this.locations = locations;
        this.applyFilters();
      });
  }

  loadLocations() {
    this.isLoading = true;
    this.errorMessage = '';

    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load locations. Please try again.';
        this.isLoading = false;
        console.error('Error loading locations:', error);
      }
    });
  }

  applyFilters() {
    this.filteredLocations = this.locations.filter(location => {
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const matchesSearch = location.locationName.toLowerCase().includes(searchLower) ||
                            location.city.toLowerCase().includes(searchLower) ||
                            location.state.toLowerCase().includes(searchLower) ||
                            location.address.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Capacity filter
      if (this.selectedCapacityRange !== 'all') {
        switch (this.selectedCapacityRange) {
          case 'small':
            if (location.capacity >= 100) return false;
            break;
          case 'medium':
            if (location.capacity < 100 || location.capacity >= 500) return false;
            break;
          case 'large':
            if (location.capacity < 500 || location.capacity >= 1000) return false;
            break;
          case 'xlarge':
            if (location.capacity < 1000) return false;
            break;
        }
      }

      return true;
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  getCapacityCategory(capacity: number): string {
    if (capacity < 100) return 'Small';
    if (capacity < 500) return 'Medium';
    if (capacity < 1000) return 'Large';
    return 'Extra Large';
  }

  getCapacityCategoryColor(capacity: number): string {
    if (capacity < 100) return 'success';
    if (capacity < 500) return 'info';
    if (capacity < 1000) return 'warning';
    return 'danger';
  }

  createLocation() {
    this.router.navigate(['/organizer/locations/create']);
  }

  editLocation(locationId: number) {
    this.router.navigate(['/organizer/locations/edit', locationId]);
  }

  viewLocation(locationId: number) {
    this.router.navigate(['/organizer/locations/view', locationId]);
  }

  trackByLocation(index: number, location: Location): number {
    return location.locationID;
  }

  get locationCount(): number {
    return this.filteredLocations.length;
  }

  get totalLocations(): number {
    return this.locations.length;
  }

  get averageCapacity(): number {
    if (this.locations.length === 0) return 0;
    const total = this.locations.reduce((sum, loc) => sum + loc.capacity, 0);
    return Math.round(total / this.locations.length);
  }

  get largestVenue(): Location | null {
    if (this.locations.length === 0) return null;
    return this.locations.reduce((max, loc) => loc.capacity > max.capacity ? loc : max);
  }
}
