import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface GameLibraryDto {
  id: string;
  gameId: string;
  gameTitle: string;
  gameCoverImageUrl: string;
  purchaseDate: string;
  purchasePrice: number;
  isInstalled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameLibraryService {
  private readonly API_BASE_URL = 'http://localhost:3001/api';

  constructor(private http: HttpClient) { }

  /**
   * Register a game purchase in the user's library
   * @param userId The user ID who made the purchase
   * @param gameId The game ID that was purchased
   * @returns Observable<GameLibraryDto> The created library entry
   */
  registerPurchase(userId: string, gameId: string): Observable<GameLibraryDto> {
    return this.http.post<GameLibraryDto>(
      `${this.API_BASE_URL}/users/${userId}/library?gameId=${gameId}`,
      null, // No request body needed
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  /**
   * Get user's game library
   * @param userId The user ID
   * @returns Observable<GameLibraryDto[]> List of games in user's library
   */
  getUserLibrary(userId: string): Observable<GameLibraryDto[]> {
    return this.http.get<GameLibraryDto[]>(
      `${this.API_BASE_URL}/users/${userId}/library`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  /**
   * Get specific game library entry
   * @param userId The user ID
   * @param gameId The game ID
   * @returns Observable<GameLibraryDto> The library entry
   */
  getGameLibraryEntry(userId: string, gameId: string): Observable<GameLibraryDto> {
    return this.http.get<GameLibraryDto>(
      `${this.API_BASE_URL}/users/${userId}/library/${gameId}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  /**
   * Update game installation status
   * @param userId The user ID
   * @param gameId The game ID
   * @param isInstalled Whether the game is installed
   * @returns Observable<void>
   */
  updateInstallationStatus(userId: string, gameId: string, isInstalled: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.API_BASE_URL}/users/${userId}/library/${gameId}/installation?installationStatus=${isInstalled}`,
      null,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('Game Library service error:', error);

    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to the Game Library service. Please make sure the API is running.';
    } else if (error.status === 400) {
      errorMessage = error.error?.error || 'Bad request. Please check your input.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    } else if (error.status === 404) {
      errorMessage = error.error?.error || 'Game or user not found.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    // Preserve the original error status for the calling code
    const customError = new Error(errorMessage);
    (customError as any).status = error.status;
    return throwError(() => customError);
  };
}
