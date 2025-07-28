// src/app/components/organizer/locations/view-location/view-location.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService, Location } from '../../../../services/location.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-view-location',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-location.component.html',
  styleUrls: ['./view-location.component.css']
})
export class ViewLocationComponent implements OnInit, OnDestroy {
  location: Location | null = null;
  isLoading = false;
  errorMessage = '';
  locationId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private locationService: LocationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.locationId = parseInt(this.route.snapshot.params['id']);
    if (this.locationId) {
      this.loadLocationDetails();
    } else {
      this.router.navigate(['/organizer/locations']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLocationDetails() {
    this.isLoading = true;
    this.errorMessage = '';

    this.locationService.getLocationById(this.locationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (location) => {
          this.location = location;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load location details.';
          this.isLoading = false;
          console.error('Error loading location:', error);
        }
      });
  }

  editLocation() {
    this.router.navigate(['/organizer/locations/edit', this.locationId]);
  }

  goBack() {
    this.router.navigate(['/organizer/locations']);
  }
}
