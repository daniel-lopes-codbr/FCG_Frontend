import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AdminOnlyService, GameDto, CreateGameDto, UpdateGameDto } from '../../../services/admin-only.service';

@Component({
  selector: 'app-game-form',
  templateUrl: './game-form.component.html',
  styleUrls: ['./game-form.component.css']
})
export class GameFormComponent implements OnInit {
  @Input() game: GameDto | null = null;
  @Input() isEdit = false;
  @Output() gameSaved = new EventEmitter<GameDto>();
  @Output() cancelled = new EventEmitter<void>();

  gameForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  // Available genres
  genres = [
    'Action', 'Adventure', 'RPG', 'Strategy', 'Sports',
    'Puzzle', 'Simulation', 'Horror', 'MMO', 'FPS'
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminOnlyService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.gameForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      price: ['', [Validators.required, Validators.min(0.01), Validators.max(999.99)]],
      releaseDate: ['', [Validators.required]],
      genre: ['', [Validators.required]],
      coverImageUrl: ['', [Validators.required, this.urlValidator()]]
    });

    if (this.isEdit && this.game) {
      this.gameForm.patchValue({
        title: this.game.title,
        description: this.game.description,
        price: this.game.price,
        releaseDate: this.formatDateForInput(this.game.releaseDate),
        genre: this.game.genre,
        coverImageUrl: this.game.coverImageUrl
      });
    }
  }

  private urlValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      const url = control.value;
      if (!url) return null;

      // For MVP: Accept any valid URL
      const urlPattern = /^https?:\/\/.+/i;
      return urlPattern.test(url) ? null : { invalidUrl: true };
    };
  }

  private formatDateForInput(dateString: string): string {
    // Convert date string to YYYY-MM-DD format for input[type="date"]
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.gameForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.gameForm.value;

      if (this.isEdit && this.game) {
        const updateData: UpdateGameDto = {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          genre: formData.genre,
          coverImageUrl: formData.coverImageUrl
        };

        this.adminService.updateGame(this.game.id, updateData).subscribe({
          next: () => {
            this.isLoading = false;
            // For update, we need to fetch the updated game data
            this.adminService.getGameById(this.game!.id).subscribe({
              next: (updatedGame) => {
                this.gameSaved.emit(updatedGame);
              },
              error: (error) => {
                console.error('Error fetching updated game:', error);
                // Still emit success even if we can't fetch the updated data
                this.gameSaved.emit(this.game!);
              }
            });
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Failed to update game';
          }
        });
      } else {
        const createData: CreateGameDto = {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          releaseDate: formData.releaseDate,
          genre: formData.genre,
          coverImageUrl: formData.coverImageUrl
        };

        this.adminService.createGame(createData).subscribe({
          next: (newGame) => {
            this.isLoading = false;
            this.gameSaved.emit(newGame);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Failed to create game';
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.gameForm.controls).forEach(key => {
      const control = this.gameForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.gameForm.get(controlName);

    if (control?.hasError('required')) {
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    }

    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minLength} characters`;
    }

    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be no more than ${maxLength} characters`;
    }

    if (control?.hasError('min')) {
      const minValue = control.getError('min').min;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${minValue}`;
    }

    if (control?.hasError('max')) {
      const maxValue = control.getError('max').max;
      return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be no more than ${maxValue}`;
    }

    if (control?.hasError('invalidUrl')) {
      return 'Please enter a valid URL (must start with http:// or https://)';
    }

    return '';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/300x400/1f2937/ffffff?text=Invalid+Image+URL';
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }
}
