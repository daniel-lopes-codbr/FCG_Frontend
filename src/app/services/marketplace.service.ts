import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export interface GameDto {
  id: string;
  title: string;
  description: string;
  price: number;
  releaseDate: string;
  genre: string;
  coverImageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private readonly API_BASE_URL = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

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

  getGames(): Observable<GameDto[]> {
    return this.http.get<GameDto[]>(`${this.API_BASE_URL}/games`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  getGameById(id: string): Observable<GameDto> {
    return this.http.get<GameDto>(`${this.API_BASE_URL}/games/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  getGamesByGenre(genre: string): Observable<GameDto[]> {
    return this.http.get<GameDto[]>(`${this.API_BASE_URL}/games/genre/${genre}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      // Network error
      errorMessage = 'Unable to connect to the game library. Please make sure the FCG_MS_Game_Library API is running.';
    } else if (error.status === 400) {
      errorMessage = 'Bad request. Please check your input.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'Forbidden. You do not have permission to access this resource.';
    } else if (error.status === 404) {
      errorMessage = 'Games not found.';
    } else if (error.status === 500) {
      errorMessage = 'Internal server error. Please try again later.';
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Marketplace service error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
