// src/app/components/organizer/events/edit-event/edit-event.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, Event, UpdateEventRequest } from '../../../../services/event.service';
import { CategoryService, Category } from '../../../../services/category.service';
import { LocationService, Location } from '../../../../services/location.service';
import { AuthService } from '../../../../services/auth.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.css']
})
export class EditEventComponent implements OnInit, OnDestroy {
  eventForm: FormGroup;
  event: Event | null = null;
  categories: Category[] = [];
  locations: Location[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  eventId: number = 0;
  currentUserId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private categoryService: CategoryService,
    private locationService: LocationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.eventForm = this.createEventForm();
  }

  ngOnInit() {
    this.currentUserId = this.getCurrentUserId();
    this.eventId = parseInt(this.route.snapshot.params['id']);

    if (!this.currentUserId) {
      this.errorMessage = 'Unable to identify user. Please login again.';
      setTimeout(() => {
        this.authService.logout();
      }, 2000);
      return;
    }

    if (this.eventId) {
      this.loadData();
      this.setupFormSubscriptions();
    } else {
      this.router.navigate(['/organizer/events']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      categoryID: [0, [Validators.required, Validators.min(1)]],
      locationID: [0, [Validators.required, Validators.min(1)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
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
        if (startDate && this.event) {
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
      event: this.eventService.getEventById(this.eventId),
      categories: this.categoryService.getCategories(),
      locations: this.locationService.getLocations()
    }).subscribe({
      next: (data) => {
        this.event = data.event;
        this.categories = data.categories;
        this.locations = data.locations;

        // Check if user owns this event
        if (this.event.userID !== this.currentUserId) {
          this.errorMessage = 'You are not authorized to edit this event.';
          this.isLoading = false;
          return;
        }

        this.populateForm();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load event data. You may not have permission to edit this event.';
        this.isLoading = false;
        console.error('Error loading event:', error);
      }
    });
  }

  populateForm() {
    if (!this.event) return;

    this.eventForm.patchValue({
      name: this.event.name,
      categoryID: this.event.categoryID,
      locationID: this.event.locationID,
      startDate: this.formatDateTimeLocal(new Date(this.event.startDate)),
      endDate: this.formatDateTimeLocal(new Date(this.event.endDate)),
      description: this.event.description,
      isPrice: this.event.isPrice,
      price: this.event.price,
      isActive: this.event.isActive
    });
  }

  onSubmit() {
    if (this.eventForm.invalid || !this.event) {
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

    // Create DTO matching backend expectations
    const eventData: UpdateEventRequest = {
      name: formValue.name.trim(),
      categoryID: parseInt(formValue.categoryID),
      locationID: parseInt(formValue.locationID),
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      userID: this.currentUserId,
      description: formValue.description.trim(),
      isPrice: formValue.isPrice,
      price: formValue.isPrice ? parseFloat(formValue.price) : 0,
      isActive: formValue.isActive
    };

    this.eventService.updateEvent(this.eventId, eventData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = `Event updated successfully!`;

        setTimeout(() => {
          this.router.navigate(['/organizer/events']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;

        // Handle different types of error responses
        if (error.error && typeof error.error === 'string') {
          this.errorMessage = error.error;
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 404) {
          this.errorMessage = 'Event not found or you do not have permission to edit it.';
        } else if (error.status === 400) {
          this.errorMessage = 'Invalid data provided. Please check your inputs.';
        } else {
          this.errorMessage = 'Failed to update event. Please try again.';
        }

        console.error('Error updating event:', error);
      }
    });
  }

  // Custom validators
  dateRangeValidator(form: FormGroup) {
    const startDate = form.get('startDate')?.value;
    const endDate = form.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // For editing, allow past dates if it's the current event's dates
      // Only validate that end date is after start date
      if (end <= start) {
        return { endDateBeforeStart: true };
      }

      // Check if duration is reasonable (max 30 days)
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

  viewEvent() {
    this.router.navigate(['/organizer/events/view', this.eventId]);
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
      endDateBeforeStart: errors?.['endDateBeforeStart'],
      durationTooLong: errors?.['durationTooLong'],
      priceRequired: errors?.['priceRequired']
    };
  }

  get isEventCompleted(): boolean {
    if (!this.event) return false;
    return new Date(this.event.endDate) < new Date();
  }

  get eventStatus(): string {
    if (!this.event) return '';

    const now = new Date();
    const startDate = new Date(this.event.startDate);
    const endDate = new Date(this.event.endDate);

    if (!this.event.isActive) return 'Draft';
    if (endDate < now) return 'Completed';
    if (startDate > now) return 'Upcoming';
    return 'Ongoing';
  }
}
