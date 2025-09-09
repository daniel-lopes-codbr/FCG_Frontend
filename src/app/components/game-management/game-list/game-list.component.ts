import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AdminOnlyService, GameDto } from '../../../services/admin-only.service';

@Component({
  selector: 'app-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.css']
})
export class GameListComponent implements OnInit {
  @Output() createGame = new EventEmitter<void>();
  @Output() editGame = new EventEmitter<GameDto>();
  @Output() viewGame = new EventEmitter<GameDto>();
  @Output() deleteGame = new EventEmitter<GameDto>();

  games: GameDto[] = [];
  loading = false;
  errorMessage = '';

  // Search and Filter
  searchTitle = '';
  selectedGenre = '';

  // Available genres
  genres = [
    'Action', 'Adventure', 'RPG', 'Strategy', 'Sports',
    'Puzzle', 'Simulation', 'Horror', 'MMO', 'FPS'
  ];

  constructor(private adminService: AdminOnlyService) {}

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getGames().subscribe({
      next: (games) => {
        this.games = this.filterGames(games);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load games';
        this.loading = false;
      }
    });
  }

  filterGames(games: GameDto[]): GameDto[] {
    let filtered = games;

    if (this.searchTitle) {
      filtered = filtered.filter(game =>
        game.title.toLowerCase().includes(this.searchTitle.toLowerCase())
      );
    }

    if (this.selectedGenre) {
      filtered = filtered.filter(game =>
        game.genre === this.selectedGenre
      );
    }

    return filtered;
  }

  onSearch(): void {
    this.loadGames();
  }

  onGenreChange(): void {
    this.loadGames();
  }

  clearFilters(): void {
    this.searchTitle = '';
    this.selectedGenre = '';
    this.loadGames();
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

  // Event handlers
  onCreateGame(): void {
    this.createGame.emit();
  }

  onEditGame(game: GameDto): void {
    this.editGame.emit(game);
  }

  onViewGame(game: GameDto): void {
    this.viewGame.emit(game);
  }

  onDeleteGame(game: GameDto): void {
    this.deleteGame.emit(game);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/300x400/1f2937/ffffff?text=No+Image';
    }
  }
}
