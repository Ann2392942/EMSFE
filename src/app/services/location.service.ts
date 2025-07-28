// src/app/services/location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Location {
  locationID: number;
  locationName: string;
  capacity: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  primaryContact: string;
  secondaryContact: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'https://localhost:7284/api/Location';
  private locationsSubject = new BehaviorSubject<Location[]>([]);
  public locations$ = this.locationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl, this.getHttpOptions())
      .pipe(
        tap(locations => this.locationsSubject.next(locations))
      );
  }

  getLocationById(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }

  createLocation(locationData: any): Observable<Location> {
    const payload = {
      locationID: 0,
      locationName: locationData.locationName.trim(),
      capacity: locationData.capacity,
      address: locationData.address.trim(),
      city: locationData.city.trim(),
      state: locationData.state.trim(),
      country: locationData.country.trim(),
      postalCode: locationData.postalCode.trim(),
      primaryContact: locationData.primaryContact.trim(),
      secondaryContact: locationData.secondaryContact.trim()
    };

    return this.http.post<Location>(this.apiUrl, payload, this.getHttpOptions())
      .pipe(
        tap(() => this.refreshLocations())
      );
  }

  updateLocation(id: number, locationData: any): Observable<any> {
    const payload = {
      locationID: id,
      locationName: locationData.locationName.trim(),
      capacity: locationData.capacity,
      address: locationData.address.trim(),
      city: locationData.city.trim(),
      state: locationData.state.trim(),
      country: locationData.country.trim(),
      postalCode: locationData.postalCode.trim(),
      primaryContact: locationData.primaryContact.trim(),
      secondaryContact: locationData.secondaryContact.trim()
    };

    return this.http.put(`${this.apiUrl}/${id}`, payload, this.getHttpOptions())
      .pipe(
        tap(() => this.refreshLocations())
      );
  }

  private refreshLocations(): void {
    this.getLocations().subscribe();
  }

  getCurrentLocations(): Location[] {
    return this.locationsSubject.value;
  }
}
