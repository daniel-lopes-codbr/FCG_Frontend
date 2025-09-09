import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AdminOnlyService, GameDto } from '../../../services/admin-only.service';

@Component({
  selector: 'app-game-details',
  templateUrl: './game-details.component.html',
  styleUrls: ['./game-details.component.css']
})
export class GameDetailsComponent implements OnInit {
  @Input() gameId: string = '';
  @Output() gameUpdated = new EventEmitter<GameDto>();
  @Output() closed = new EventEmitter<void>();

  game: GameDto | null = null;
  loading = false;
  errorMessage = '';

  constructor(private adminService: AdminOnlyService) {}

  ngOnInit(): void {
    if (this.gameId) {
      this.loadGame();
    }
  }

  loadGame(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getGameById(this.gameId).subscribe({
      next: (game) => {
        this.game = game;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load game details';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  onEdit(): void {
    // Emit the game data to the parent component to trigger edit mode
    if (this.game) {
      this.gameUpdated.emit(this.game);
    }
  }

  onDelete(): void {
    if (this.game && confirm(`Are you sure you want to delete game "${this.game.title}"? This action cannot be undone.`)) {
      this.loading = true;
      this.adminService.deleteGame(this.game.id).subscribe({
        next: () => {
          this.loading = false;
          this.onClose();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to delete game';
          this.loading = false;
        }
      });
    }
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
      month: 'long',
      day: 'numeric'
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/300x400/1f2937/ffffff?text=No+Image';
    }
  }
}
