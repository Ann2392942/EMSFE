// src/app/components/organizer/locations/create-location/create-location.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationService } from '../../../../services/location.service';

@Component({
  selector: 'app-create-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-location.component.html',
  styleUrls: ['./create-location.component.css']
})
export class CreateLocationComponent implements OnInit {
  locationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private router: Router
  ) {
    this.locationForm = this.createLocationForm();
  }

  ngOnInit() {}

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

  onSubmit() {
    if (this.locationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const locationData = {
      locationID: 0,
      ...this.locationForm.value
    };

    this.locationService.createLocation(locationData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = `Location "${response.locationName}" created successfully!`;

        setTimeout(() => {
          this.router.navigate(['/organizer/locations']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Failed to create location. Please try again.';
        console.error('Error creating location:', error);
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

/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * A convenience getter to access the controls of the form.
   *
/*******  509b29b2-ba71-4ddf-bf74-608f3c89e2e7  *******/  get f() {
    return this.locationForm.controls;
  }
}
