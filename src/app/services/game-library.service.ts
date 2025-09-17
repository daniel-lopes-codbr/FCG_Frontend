import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

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
  constructor(private http: HttpClient, private configService: ConfigService) { }

  private getApiBaseUrl(): string {
    try {
      return this.configService.getApiUrl('gameLibraryApi') + '/api';
    } catch (error) {
      // Fallback to localhost if config not loaded yet
      return 'http://localhost:5011/api';
    }
  }

  /**
   * Register a game purchase in the user's library
   * @param userId The user ID who made the purchase
   * @param gameId The game ID that was purchased
   * @returns Observable<GameLibraryDto> The created library entry
   */
  registerPurchase(userId: string, gameId: string): Observable<GameLibraryDto> {
    const url = `${this.getApiBaseUrl()}/users/${userId}/library?gameId=${gameId}`;
    console.log('🌐 GameLibraryService.registerPurchase called');
    console.log('📝 User ID:', userId);
    console.log('📝 Game ID:', gameId);
    console.log('🔗 URL:', url);

    const headers = this.getHeaders();
    console.log('🔑 Headers:', {
      'Content-Type': headers.get('Content-Type'),
      'Authorization': headers.get('Authorization') ? 'Bearer [TOKEN]' : 'No token'
    });

    return this.http.post<GameLibraryDto>(
      url,
      null, // No request body needed
      {
        headers: headers
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
      `${this.getApiBaseUrl()}/users/${userId}/library`,
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
      `${this.getApiBaseUrl()}/users/${userId}/library/${gameId}`,
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
      `${this.getApiBaseUrl()}/users/${userId}/library/${gameId}/installation?installationStatus=${isInstalled}`,
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
    console.log('🔑 Raw JWT token from localStorage:', token);
    
    if (!token) {
      console.error('❌ No JWT token found in localStorage');
      throw new Error('No authentication token found');
    }
    
    // Decode JWT token to check if it's valid
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('🔑 JWT payload:', payload);
        console.log('🔑 JWT expiration:', new Date(payload.exp * 1000));
        console.log('🔑 JWT is expired:', new Date(payload.exp * 1000) < new Date());
      } else {
        console.error('❌ Invalid JWT token format');
      }
    } catch (error) {
      console.error('❌ Error decoding JWT token:', error);
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('❌ Game Library service error:', error);
    console.error('❌ Error status:', error.status);
    console.error('❌ Error statusText:', error.statusText);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error error:', error.error);
    console.error('❌ Error url:', error.url);
    console.error('❌ Error headers:', error.headers);

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

    console.error('❌ Final error message:', errorMessage);

    // Preserve the original error status for the calling code
    const customError = new Error(errorMessage);
    (customError as any).status = error.status;
    return throwError(() => customError);
  };
}
