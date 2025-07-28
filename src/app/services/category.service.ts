// src/app/services/category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Category {
  categoryID: number;
  categoryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'https://localhost:7284/api/Categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl, this.getHttpOptions())
      .pipe(
        tap(categories => this.categoriesSubject.next(categories))
      );
  }

  createCategory(categoryData: any): Observable<Category> {
    const payload = {
      categoryID: 0,
      categoryName: categoryData.categoryName
    };

    return this.http.post<Category>(this.apiUrl, payload, this.getHttpOptions())
      .pipe(
        tap(() => this.refreshCategories())
      );
  }

  private refreshCategories(): void {
    this.getCategories().subscribe();
  }

  getCurrentCategories(): Category[] {
    return this.categoriesSubject.value;
  }
}
