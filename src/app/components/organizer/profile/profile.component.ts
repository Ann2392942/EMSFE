// src/app/components/organizer/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizerUserService, OrganizerDetails, EditOrganizerDetailsDto } from '../../../services/organizer-user.service';

@Component({
  selector: 'app-organizer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class OrganizerProfileComponent implements OnInit {
  // Organizer data
  organizer: OrganizerDetails | null = null;

  // Form data
  editData = {
    name: '',
    contactNumber: ''
  };

  // UI states
  loading = false;
  saving = false;
  editing = false;
  message = '';
  error = '';

  constructor(private organizerUserService: OrganizerUserService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.error = '';

    this.organizerUserService.getOrganizerDetails().subscribe({
      next: (data) => {
        console.log('✅ Organizer profile loaded successfully:', data);
        this.organizer = data;
        this.resetForm();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Organizer profile load failed:', err);
        this.error = 'Failed to load profile. Please try again.';
        this.loading = false;
      }
    });
  }

  startEdit() {
    this.editing = true;
    this.message = '';
    this.error = '';
    this.resetForm();
  }

  cancelEdit() {
    this.editing = false;
    this.resetForm();
    this.message = '';
    this.error = '';
  }

  saveProfile() {
    if (!this.isValid()) {
      this.error = 'Please fill all required fields';
      return;
    }

    this.saving = true;
    this.error = '';

    const updateData: EditOrganizerDetailsDto = {
      name: this.editData.name.trim(),
      contactNumber: this.editData.contactNumber.trim()
    };

    this.organizerUserService.updateOrganizerDetails(updateData).subscribe({
      next: () => {
        console.log('✅ Organizer profile updated successfully');
        this.message = 'Profile updated successfully!';
        this.editing = false;
        this.saving = false;

        // Update local data
        if (this.organizer) {
          this.organizer.name = updateData.name;
          this.organizer.contactNumber = updateData.contactNumber;
        }

        // Clear message after 3 seconds
        setTimeout(() => this.message = '', 3000);
      },
      error: (error) => {
        console.error('❌ Organizer profile update failed:', error);
        this.error = 'Failed to update profile. Please try again.';
        this.saving = false;
      }
    });
  }

  resetForm() {
    if (this.organizer) {
      this.editData = {
        name: this.organizer.name,
        contactNumber: this.organizer.contactNumber
      };
    }
  }

  isValid(): boolean {
    return this.editData.name.trim().length > 0 &&
           this.editData.contactNumber.trim().length > 0;
  }

  getRoleColor(): string {
    if (!this.organizer) return 'secondary';

    switch (this.organizer.role.toLowerCase()) {
      case 'admin': return 'danger';
      case 'organizer': return 'success';
      case 'user': return 'primary';
      default: return 'secondary';
    }
  }

  formatPhone(phone: string): string {
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  }
}
