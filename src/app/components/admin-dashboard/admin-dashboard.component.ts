import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { UserDto } from '../../models/user.model';
import { AdminOnlyService } from '../../services/admin-only.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: UserDto | null = null;
  darkMode$ = this.themeService.darkMode$;
  activeTab: 'users' | 'games' | 'overview' = 'overview';

  // User management state
  showUserForm = false;
  showUserDetails = false;
  selectedUser: UserDto | null = null;
  isEditMode = false;

  // Game management state - STEP 1: Basic state for game list
  showGameForm = false;
  showGameDetails = false;
  selectedGame: any = null;
  isGameEditMode = false;

  constructor(
    private authService: AuthService,
    public router: Router,
    private themeService: ThemeService,
    private adminService: AdminOnlyService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (!this.currentUser || this.currentUser.permission !== 'Admin') {
      this.router.navigate(['/dashboard']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  setActiveTab(tab: 'users' | 'games' | 'overview'): void {
    this.activeTab = tab;
  }

  getInitialLetter(): string {
    if (!this.currentUser?.name) return 'A';
    return this.currentUser.name.charAt(0).toUpperCase();
  }

  navigateToUserDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // User management methods
  createUser(): void {
    this.selectedUser = null;
    this.isEditMode = false;
    this.showUserForm = true;
    this.showUserDetails = false;
  }

  editUser(user: UserDto): void {
    this.selectedUser = user;
    this.isEditMode = true;
    this.showUserForm = true;
    this.showUserDetails = false;
  }

  viewUser(user: UserDto): void {
    this.selectedUser = user;
    this.showUserDetails = true;
    this.showUserForm = false;
  }

  deleteUser(user: UserDto): void {
    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          // Refresh the user list or show success message
          console.log('User deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  onUserSaved(user: UserDto): void {
    this.showUserForm = false;
    this.selectedUser = null;
    // Refresh the user list or show success message
    console.log('User saved successfully:', user);
  }

  onUserFormCancelled(): void {
    this.showUserForm = false;
    this.selectedUser = null;
  }

  onUserDetailsClosed(): void {
    this.showUserDetails = false;
    this.selectedUser = null;
  }

  onUserUpdated(user: UserDto): void {
    this.showUserDetails = false;
    this.selectedUser = null;
    // Refresh the user list or show success message
    console.log('User updated successfully:', user);
  }

  onUserPermissionChanged(user: UserDto): void {
    // Show success message or update UI
    console.log('User permission changed successfully:', user);
    // You could add a toast notification here
  }

  // Game management methods - STEP 2: Full CRUD with form component
  createGame(): void {
    this.selectedGame = null;
    this.isGameEditMode = false;
    this.showGameForm = true;
    this.showGameDetails = false;
  }

  editGame(game: any): void {
    this.selectedGame = game;
    this.isGameEditMode = true;
    this.showGameForm = true;
    this.showGameDetails = false;
  }

  viewGame(game: any): void {
    this.selectedGame = game;
    this.showGameDetails = true;
    this.showGameForm = false;
  }

  deleteGame(game: any): void {
    if (confirm(`Are you sure you want to delete game "${game.title}"? This action cannot be undone.`)) {
      this.adminService.deleteGame(game.id).subscribe({
        next: () => {
          console.log('Game deleted successfully');
          alert('Game deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting game:', error);
          alert('Error deleting game: ' + (error.message || 'Unknown error'));
        }
      });
    }
  }

  onGameSaved(game: any): void {
    this.showGameForm = false;
    this.selectedGame = null;
    console.log('Game saved successfully:', game);
    alert(`Game ${this.isGameEditMode ? 'updated' : 'created'} successfully!`);
  }

  onGameFormCancelled(): void {
    this.showGameForm = false;
    this.selectedGame = null;
  }

  onGameDetailsClosed(): void {
    this.showGameDetails = false;
    this.selectedGame = null;
  }

  onGameUpdated(game: any): void {
    // When edit is clicked from game details, switch to edit mode
    this.selectedGame = game;
    this.isGameEditMode = true;
    this.showGameForm = true;
    this.showGameDetails = false;
  }
}
