// src/app/components/organizer/events/create-event/create-event.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService, CreateEventRequest } from '../../../../services/event.service';
import { CategoryService, Category } from '../../../../services/category.service';
import { LocationService, Location } from '../../../../services/location.service';
import { AuthService } from '../../../../services/auth.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements OnInit, OnDestroy {
  eventForm: FormGroup;
  categories: Category[] = [];
  locations: Location[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  currentUser: any = null;
  currentUserId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private categoryService: CategoryService,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.eventForm = this.createEventForm();
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.currentUserId = this.getCurrentUserId();

    if (!this.currentUserId) {
      this.errorMessage = 'Unable to identify user. Please login again.';
      setTimeout(() => {
        this.authService.logout();
      }, 2000);
      return;
    }

    this.loadData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Get current user ID from JWT token
  private getCurrentUserId(): number {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userIdClaim = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        return parseInt(userIdClaim) || 0;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    return 0;
  }

  createEventForm(): FormGroup {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      categoryID: [0, [Validators.required, Validators.min(1)]],
      locationID: [0, [Validators.required, Validators.min(1)]],
      startDate: [this.formatDateTimeLocal(tomorrow), [Validators.required]],
      endDate: [this.formatDateTimeLocal(nextWeek), [Validators.required]],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]],
      isPrice: [false],
      price: [{ value: 0, disabled: true }, [Validators.min(0), Validators.max(10000)]],
      isActive: [true]
    }, {
      validators: [this.dateRangeValidator, this.priceValidator]
    });
  }

  setupFormSubscriptions() {
    // Enable/disable price field based on isPrice checkbox
    this.eventForm.get('isPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isPrice => {
        const priceControl = this.eventForm.get('price');
        if (isPrice) {
          priceControl?.enable();
          priceControl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(10000)]);
        } else {
          priceControl?.disable();
          priceControl?.setValue(0);
          priceControl?.setValidators([Validators.min(0), Validators.max(10000)]);
        }
        priceControl?.updateValueAndValidity();
      });

    // Update end date when start date changes
    this.eventForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(startDate => {
        if (startDate) {
          const endDateControl = this.eventForm.get('endDate');
          const currentEndDate = endDateControl?.value;

          if (!currentEndDate || new Date(currentEndDate) <= new Date(startDate)) {
            const newEndDate = new Date(startDate);
            newEndDate.setHours(newEndDate.getHours() + 2);
            endDateControl?.setValue(this.formatDateTimeLocal(newEndDate));
          }
        }
      });
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categories: this.categoryService.getCategories(),
      locations: this.locationService.getLocations()
    }).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.locations = data.locations;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load required data. Please refresh the page.';
        this.isLoading = false;
        console.error('Error loading data:', error);
      }
    });
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.currentUserId) {
      this.errorMessage = 'Unable to identify user. Please login again.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.eventForm.value;
    const eventData: CreateEventRequest = {
      eventID: 0,
      name: formValue.name.trim(),
      categoryID: parseInt(formValue.categoryID),
      locationID: parseInt(formValue.locationID),
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      userID: this.currentUserId, // Use extracted user ID
      description: formValue.description.trim(),
      isPrice: formValue.isPrice,
      price: formValue.isPrice ? parseFloat(formValue.price) : 0,
      isActive: formValue.isActive,
      bookedCapacity: 0
    };

    this.eventService.createEvent(eventData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = `Event "${response.name}" created successfully!`;

        setTimeout(() => {
          this.router.navigate(['/organizer/events']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Failed to create event. Please try again.';
        console.error('Error creating event:', error);
      }
    });
  }

  // Custom validators remain the same...
  dateRangeValidator(form: FormGroup) {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start <= now) {
        return { startDatePast: true };
      }

      if (end <= start) {
        return { endDateBeforeStart: true };
      }

      const maxDuration = 30 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > maxDuration) {
        return { durationTooLong: true };
      }
    }

    return null;
  }

  priceValidator(form: FormGroup) {
    const isPrice = form.get('isPrice')?.value;
    const price = form.get('price')?.value;

    if (isPrice && (!price || price <= 0)) {
      return { priceRequired: true };
    }

    return null;
  }

  formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private markFormGroupTouched() {
    Object.keys(this.eventForm.controls).forEach(key => {
      this.eventForm.get(key)?.markAsTouched();
    });
  }

  goBack() {
    this.router.navigate(['/organizer/events']);
  }

  get f() {
    return this.eventForm.controls;
  }

  get selectedLocation(): Location | null {
    const locationId = this.eventForm.get('locationID')?.value;
    return this.locations.find(loc => loc.locationID == locationId) || null;
  }

  get formErrors() {
    const errors = this.eventForm.errors;
    return {
      startDatePast: errors?.['startDatePast'],
      endDateBeforeStart: errors?.['endDateBeforeStart'],
      durationTooLong: errors?.['durationTooLong'],
      priceRequired: errors?.['priceRequired']
    };
  }
}
