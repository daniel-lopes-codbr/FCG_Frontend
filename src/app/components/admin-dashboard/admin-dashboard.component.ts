import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { UserDto } from '../../models/user.model';
import { AdminOnlyService } from '../../services/admin-only.service';
import { SystemHealthService, SystemHealthOverview, ApiHealth } from '../../services/system-health.service';
import { OperationalMetricsService, OperationalMetrics } from '../../services/operational-metrics.service';
import { NotificationService } from '../../services/notification.service';

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

  // System health and operational metrics
  systemHealth: SystemHealthOverview | null = null;
  operationalMetrics: OperationalMetrics | null = null;
  isLoadingHealth = false;
  isLoadingMetrics = false;
  healthError = '';
  metricsError = '';

  constructor(
    private authService: AuthService,
    public router: Router,
    private themeService: ThemeService,
    private adminService: AdminOnlyService,
    private systemHealthService: SystemHealthService,
    private operationalMetricsService: OperationalMetricsService,
    private notificationService: NotificationService
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

    // Load data when switching to overview tab
    if (tab === 'overview') {
      this.loadSystemHealth();
      this.loadOperationalMetrics();
    }
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
  }

  onUserPermissionChanged(user: UserDto): void {
    // Show success message or update UI
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
          this.notificationService.showSuccess(
            'Game Deleted',
            `"${game.title}" has been successfully deleted from the game library.`,
            4000
          );
        },
        error: (error) => {
          console.error('Error deleting game:', error);
          this.notificationService.showError(
            'Delete Failed',
            error.message || 'Failed to delete game. Please try again.',
            5000
          );
        }
      });
    }
  }

  onGameSaved(game: any): void {
    this.showGameForm = false;
    this.selectedGame = null;
    // Toast notification is already handled in the game form component
    // No need to show another notification here
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

  // System Health and Operational Metrics Methods
  private loadSystemHealth(): void {
    this.isLoadingHealth = true;
    this.healthError = '';

    this.systemHealthService.getSystemHealthOverview().subscribe({
      next: (health) => {
        this.systemHealth = health;
        this.isLoadingHealth = false;
      },
      error: (error) => {
        console.error('❌ Error loading system health:', error);
        this.healthError = 'Unable to load system health. Please try again later.';
        this.isLoadingHealth = false;
      }
    });
  }

  private loadOperationalMetrics(): void {
    this.isLoadingMetrics = true;
    this.metricsError = '';

    this.operationalMetricsService.getOperationalMetrics().subscribe({
      next: (metrics) => {
        this.operationalMetrics = metrics;
        this.isLoadingMetrics = false;
      },
      error: (error) => {
        console.error('❌ Error loading operational metrics:', error);
        this.metricsError = 'Unable to load operational metrics. Please try again later.';
        this.isLoadingMetrics = false;
      }
    });
  }

  refreshSystemHealth(): void {
    this.loadSystemHealth();
  }

  refreshOperationalMetrics(): void {
    this.loadOperationalMetrics();
  }

  getHealthStatusClass(status: string): string {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getApiStatusClass(status: string): string {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'unhealthy':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  formatResponseTime(time: number): string {
    return `${time.toFixed(0)}ms`;
  }

  formatTimestamp(timestamp: Date): string {
    return new Date(timestamp).toLocaleString();
  }
}
