import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AdminOnlyService, UserDto, PaginatedResponse } from '../../../services/admin-only.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  @Output() createUser = new EventEmitter<void>();
  @Output() editUser = new EventEmitter<UserDto>();
  @Output() viewUser = new EventEmitter<UserDto>();
  @Output() deleteUser = new EventEmitter<UserDto>();
  @Output() permissionChanged = new EventEmitter<UserDto>();

  users: UserDto[] = [];
  loading = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Search
  searchEmail = '';
  searchName = '';

  constructor(private adminService: AdminOnlyService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getUsers(
      this.currentPage,
      this.pageSize,
      this.searchEmail || undefined,
      this.searchName || undefined
    ).subscribe({
      next: (response: PaginatedResponse<UserDto>) => {
        this.users = response.data;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.currentPage = response.pageNumber;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadUsers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getPermissionBadgeClass(permission: string): string {
    return permission === 'Admin'
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }

  // Event handlers
  onCreateUser(): void {
    this.createUser.emit();
  }

  onEditUser(user: UserDto): void {
    this.editUser.emit(user);
  }

  onViewUser(user: UserDto): void {
    this.viewUser.emit(user);
  }

  onDeleteUser(user: UserDto): void {
    this.deleteUser.emit(user);
  }

  onPermissionChange(user: UserDto, newPermission: number): void {
    // For MVP: Just update the UI optimistically and handle errors gracefully
    this.adminService.updateUserPermission(user.id, newPermission).subscribe({
      next: (updatedUser) => {
        // Update the user in the local array
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.permissionChanged.emit(updatedUser);
        // Clear any previous error messages
        this.errorMessage = '';
      },
      error: (error) => {
        // For MVP: Don't show error messages for permission changes
        // The service handles errors gracefully by fetching current data
        console.log('Permission update handled gracefully:', error);
        this.errorMessage = '';
      }
    });
  }

  // Helper method for template
  Math = Math;
}
