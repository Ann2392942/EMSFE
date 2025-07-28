// src/app/components/organizer/locations/edit-location/edit-location.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService, Location } from '../../../../services/location.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-edit-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-location.component.html',
  styleUrls: ['./edit-location.component.css']
})
export class EditLocationComponent implements OnInit, OnDestroy {
  locationForm: FormGroup;
  location: Location | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  locationId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.locationForm = this.createLocationForm();
  }

  ngOnInit() {
    this.locationId = parseInt(this.route.snapshot.params['id']);

    if (this.locationId) {
      this.loadLocationData();
    } else {
      this.router.navigate(['/organizer/locations']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createLocationForm(): FormGroup {
    return this.fb.group({
      locationName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      capacity: [0, [Validators.required, Validators.min(1), Validators.max(100000)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9a-zA-Z\s-]{3,10}$/)]],
      primaryContact: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9]{10,15}$/)]],
      secondaryContact: ['', [Validators.pattern(/^[\+]?[0-9]{10,15}$/)]]
    });
  }

  loadLocationData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.locationService.getLocationById(this.locationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (location) => {
          this.location = location;
          this.populateForm();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load location data.';
          this.isLoading = false;
          console.error('Error loading location:', error);
        }
      });
  }

  populateForm() {
    if (!this.location) return;

    this.locationForm.patchValue({
      locationName: this.location.locationName,
      capacity: this.location.capacity,
      address: this.location.address,
      city: this.location.city,
      state: this.location.state,
      country: this.location.country,
      postalCode: this.location.postalCode,
      primaryContact: this.location.primaryContact,
      secondaryContact: this.location.secondaryContact
    });
  }

  onSubmit() {
    if (this.locationForm.invalid || !this.location) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.locationForm.value;

    const locationData = {
      locationID: this.locationId,
      locationName: formValue.locationName.trim(),
      capacity: parseInt(formValue.capacity),
      address: formValue.address.trim(),
      city: formValue.city.trim(),
      state: formValue.state.trim(),
      country: formValue.country.trim(),
      postalCode: formValue.postalCode.trim(),
      primaryContact: formValue.primaryContact.trim(),
      secondaryContact: formValue.secondaryContact ? formValue.secondaryContact.trim() : ''
    };

    this.locationService.updateLocation(this.locationId, locationData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Location updated successfully!';

        setTimeout(() => {
          this.router.navigate(['/organizer/locations']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;

        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.error?.title) {
          this.errorMessage = error.error.title;
        } else if (error.status === 404) {
          this.errorMessage = 'Location not found.';
        } else if (error.status === 400) {
          this.errorMessage = 'Invalid data provided. Please check your inputs.';
        } else {
          this.errorMessage = 'Failed to update location. Please try again.';
        }

        console.error('Error updating location:', error);
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.locationForm.controls).forEach(key => {
      this.locationForm.get(key)?.markAsTouched();
    });
  }

  goBack() {
    this.router.navigate(['/organizer/locations']);
  }

  viewLocation() {
    this.router.navigate(['/organizer/locations/view', this.locationId]);
  }

  get f() {
    return this.locationForm.controls;
  }
}
