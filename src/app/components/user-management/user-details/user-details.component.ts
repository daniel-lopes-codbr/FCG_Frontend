import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AdminOnlyService, UserDto } from '../../../services/admin-only.service';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
  @Input() userId: string = '';
  @Output() userUpdated = new EventEmitter<UserDto>();
  @Output() closed = new EventEmitter<void>();

  user: UserDto | null = null;
  loading = false;
  errorMessage = '';

  constructor(private adminService: AdminOnlyService) {}

  ngOnInit(): void {
    if (this.userId) {
      this.loadUser();
    }
  }

  loadUser(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load user details';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  onEdit(): void {
    // This will be handled by the parent component
    // For now, just emit the user data
    if (this.user) {
      this.userUpdated.emit(this.user);
    }
  }

  onDelete(): void {
    if (this.user && confirm(`Are you sure you want to delete user "${this.user.name}"? This action cannot be undone.`)) {
      this.loading = true;
      this.adminService.deleteUser(this.user.id).subscribe({
        next: () => {
          this.loading = false;
          this.onClose();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to delete user';
          this.loading = false;
        }
      });
    }
  }

  getPermissionBadgeClass(permission: string): string {
    return permission === 'Admin'
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }

  getInitialLetter(): string {
    if (!this.user?.name) return 'U';
    return this.user.name.charAt(0).toUpperCase();
  }
}
