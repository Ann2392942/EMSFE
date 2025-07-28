// src/app/components/user/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserDetails, EditUserDetailsDto } from '../../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // User data
  user: UserDetails | null = null;

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

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.error = '';

    this.userService.getUserDetails().subscribe({
      next: (data) => {
        console.log('✅ Profile loaded successfully:', data);
        this.user = data;
        this.resetForm();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Profile load failed:', err);
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

    const updateData: EditUserDetailsDto = {
      name: this.editData.name.trim(),
      contactNumber: this.editData.contactNumber.trim()
    };

    this.userService.updateUserDetails(updateData).subscribe({
      next: () => {
        console.log('✅ Profile updated successfully');
        this.message = 'Profile updated successfully!';
        this.editing = false;
        this.saving = false;

        // Update local data
        if (this.user) {
          this.user.name = updateData.name;
          this.user.contactNumber = updateData.contactNumber;
        }

        // Clear message after 3 seconds
        setTimeout(() => this.message = '', 3000);
      },
      error: (error) => {
        console.error('❌ Profile update failed:', error);
        this.error = 'Failed to update profile. Please try again.';
        this.saving = false;
      }
    });
  }

  resetForm() {
    if (this.user) {
      this.editData = {
        name: this.user.name,
        contactNumber: this.user.contactNumber
      };
    }
  }

  isValid(): boolean {
    return this.editData.name.trim().length > 0 &&
           this.editData.contactNumber.trim().length > 0;
  }

  getRoleColor(): string {
    if (!this.user) return 'secondary';

    switch (this.user.role.toLowerCase()) {
      case 'admin': return 'danger';
      case 'organizer': return 'warning';
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
