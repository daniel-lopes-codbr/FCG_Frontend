import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CartService } from '../../services/cart.service';
import { GameLibraryService, GameLibraryDto } from '../../services/game-library.service';
import { BusinessMetricsService, BusinessMetrics } from '../../services/business-metrics.service';
import { UserDto } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: UserDto | null = null;
  darkMode$ = this.themeService.darkMode$;
  userGameLibrary: GameLibraryDto[] = [];
  isLoadingLibrary = false;
  libraryError = '';

  // Admin business metrics
  businessMetrics: BusinessMetrics = {
    totalUsers: 0,
    totalGames: 0,
    totalSales: 0,
    totalRevenue: 0
  };
  isLoadingMetrics = false;
  metricsError = '';

  constructor(
    private authService: AuthService,
    public router: Router,
    private themeService: ThemeService,
    private cartService: CartService,
    private gameLibraryService: GameLibraryService,
    private businessMetricsService: BusinessMetricsService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    } else {
      // Load appropriate data based on user type
      if (this.currentUser.permission === 'Admin') {
        this.loadBusinessMetrics();
      } else {
        this.loadUserGameLibrary();
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getPermissionBadgeClass(): string {
    if (!this.currentUser) return '';

    return this.currentUser.permission === 'Admin'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }

  getInitialLetter(): string {
    if (!this.currentUser?.name) return 'U';
    return this.currentUser.name.charAt(0).toUpperCase();
  }

  navigateToAdminPanel(): void {
    this.router.navigate(['/admin']);
  }

  navigateToMarketplace(): void {
    this.router.navigate(['/marketplace']);
  }

  getCartItemCount(): number {
    return this.cartService.getCartItemCount();
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  private loadBusinessMetrics(): void {
    this.isLoadingMetrics = true;
    this.metricsError = '';

    this.businessMetricsService.getBusinessMetrics().subscribe({
      next: (metrics) => {
        this.businessMetrics = metrics;
        this.isLoadingMetrics = false;
        console.log('📊 Business metrics loaded:', metrics);
      },
      error: (error) => {
        console.error('❌ Error loading business metrics:', error);
        this.metricsError = 'Unable to load business metrics. Please try again later.';
        this.isLoadingMetrics = false;
      }
    });
  }

  private loadUserGameLibrary(): void {
    if (!this.currentUser) return;

    this.isLoadingLibrary = true;
    this.libraryError = '';

    this.gameLibraryService.getUserLibrary(this.currentUser.id).subscribe({
      next: (library) => {
        this.userGameLibrary = library;
        this.isLoadingLibrary = false;
        console.log('📚 User game library loaded:', library);
      },
      error: (error) => {
        console.error('❌ Error loading user game library:', error);
        this.libraryError = 'Unable to load your game library. Please try again later.';
        this.isLoadingLibrary = false;
      }
    });
  }

  getGamesOwnedCount(): number {
    return this.userGameLibrary.length;
  }

  getRecentGames(): GameLibraryDto[] {
    // Return the 3 most recently purchased games
    return this.userGameLibrary
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, 3);
  }

  formatPurchaseDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getInstallationStatusText(isInstalled: boolean): string {
    return isInstalled ? 'Installed' : 'Not Installed';
  }

  getInstallationStatusClass(isInstalled: boolean): string {
    return isInstalled
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  toggleInstallationStatus(game: GameLibraryDto): void {
    if (!this.currentUser) return;

    const newStatus = !game.isInstalled;

    this.gameLibraryService.updateInstallationStatus(
      this.currentUser.id,
      game.gameId,
      newStatus
    ).subscribe({
      next: () => {
        // Update the local state
        game.isInstalled = newStatus;
        console.log(`✅ Installation status updated for ${game.gameTitle}: ${newStatus ? 'Installed' : 'Not Installed'}`);
      },
      error: (error) => {
        console.error('❌ Error updating installation status:', error);
        // You could show a toast notification here
      }
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/300x200?text=Game+Image';
    }
  }
}
