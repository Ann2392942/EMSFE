// src/app/components/organizer/categories/categories.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, Category } from '../../../services/category.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  categoryForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  showCreateForm = false;
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      categoryName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.subscribeToCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  subscribeToCategories() {
    this.categoryService.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  loadCategories() {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load categories. Please try again.';
        this.isLoading = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.categoryForm.reset();
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  onSubmit() {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const newCategoryName = this.categoryForm.value.categoryName.trim().toLowerCase();
    const isDuplicate = this.categories.some(cat =>
      cat.categoryName.toLowerCase() === newCategoryName
    );

    if (isDuplicate) {
      this.errorMessage = 'A category with this name already exists.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const categoryData = {
      categoryName: this.categoryForm.value.categoryName
    };

    this.categoryService.createCategory(categoryData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = `Category "${response.categoryName}" created successfully!`;
        this.categoryForm.reset();
        this.showCreateForm = false;

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Failed to create category. Please try again.';
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.categoryForm.controls).forEach(key => {
      this.categoryForm.get(key)?.markAsTouched();
    });
  }

  trackByCategory(index: number, category: Category): number {
    return category.categoryID;
  }

  get f() {
    return this.categoryForm.controls;
  }

  get categoryCount(): number {
    return this.categories.length;
  }

  get formTitle(): string {
    return 'Create New Category';
  }

  get submitButtonText(): string {
    return this.isSubmitting ? 'Creating...' : 'Create Category';
  }
}
