import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { MarketplaceService, GameDto } from '../../services/marketplace.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { UserDto } from '../../models/user.model';

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css']
})
export class MarketplaceComponent implements OnInit {
  currentUser: UserDto | null = null;
  darkMode$ = this.themeService.darkMode$;

  // Game marketplace data
  games: GameDto[] = [];
  newGames: GameDto[] = [];
  otherGames: GameDto[] = [];
  loading = false;
  errorMessage = '';

  // Search and filter
  searchTerm = '';
  selectedGenre = '';
  genres = [
    'Action', 'Adventure', 'RPG', 'Strategy', 'Sports',
    'Puzzle', 'Simulation', 'Horror', 'MMO', 'FPS'
  ];

  constructor(
    private authService: AuthService,
    public router: Router,
    private themeService: ThemeService,
    private marketplaceService: MarketplaceService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    } else if (this.currentUser.permission === 'Admin') {
      // Redirect admin users to admin panel
      this.router.navigate(['/admin']);
    } else {
      this.loadGames();
    }
  }

  loadGames(): void {
    this.loading = true;
    this.errorMessage = '';

    this.marketplaceService.getGames().subscribe({
      next: (games) => {
        this.games = games;
        this.categorizeGames();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load games';
        this.loading = false;
        console.error('Error loading games:', error);
      }
    });
  }

  private categorizeGames(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    this.newGames = [];
    this.otherGames = [];

    this.games.forEach(game => {
      const gameDate = new Date(game.releaseDate);
      const gameMonth = gameDate.getMonth();
      const gameYear = gameDate.getFullYear();

      // Check if game was released in the current month and year
      if (gameMonth === currentMonth && gameYear === currentYear) {
        this.newGames.push(game);
      } else {
        this.otherGames.push(game);
      }
    });

    // Sort new games by release date (newest first)
    this.newGames.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    // Sort other games by release date (newest first)
    this.otherGames.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  }

  onSearch(): void {
    // Filter games based on search term and genre
    this.filterGames();
  }

  onGenreChange(): void {
    // Filter games based on selected genre
    this.filterGames();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedGenre = '';
    this.loadGames(); // Reload all games
  }

  private filterGames(): void {
    if (!this.searchTerm && !this.selectedGenre) {
      this.loadGames(); // Show all games if no filters
      return;
    }

    this.loading = true;
    this.marketplaceService.getGames().subscribe({
      next: (games) => {
        let filteredGames = games;

        // Filter by search term
        if (this.searchTerm) {
          filteredGames = filteredGames.filter(game =>
            game.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            game.description.toLowerCase().includes(this.searchTerm.toLowerCase())
          );
        }

        // Filter by genre
        if (this.selectedGenre) {
          filteredGames = filteredGames.filter(game => game.genre === this.selectedGenre);
        }

        this.games = filteredGames;
        this.categorizeGames();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to filter games';
        this.loading = false;
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getGenreBadgeClass(genre: string): string {
    const genreColors: { [key: string]: string } = {
      'Action': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Adventure': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'RPG': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Strategy': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Sports': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Puzzle': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Simulation': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'Horror': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'MMO': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'FPS': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
    };

    return genreColors[genre] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/300x400/1f2937/ffffff?text=No+Image';
    }
  }

  onBuyGame(game: GameDto): void {
    this.cartService.addToCart(game);
    // Show beautiful success notification
    this.notificationService.showSuccess(
      'Game Added to Cart!',
      `"${game.title}" has been added to your cart successfully.`,
      3000
    );
  }

  isGameInCart(gameId: string): boolean {
    return this.cartService.isGameInCart(gameId);
  }

  getCartItemCount(): number {
    return this.cartService.getCartItemCount();
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
