import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { AdminOnlyService } from './admin-only.service';
import { MarketplaceService } from './marketplace.service';
import { GameLibraryService } from './game-library.service';

export interface BusinessMetrics {
  totalUsers: number;
  totalGames: number;
  totalSales: number;
  totalRevenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessMetricsService {
  private readonly USER_API_BASE_URL = 'http://localhost:3002/api';
  private readonly GAME_LIBRARY_API_BASE_URL = 'http://localhost:3001/api';

  constructor(
    private http: HttpClient,
    private adminOnlyService: AdminOnlyService,
    private marketplaceService: MarketplaceService,
    private gameLibraryService: GameLibraryService
  ) {}

  /**
   * Get comprehensive business metrics for admin dashboard
   * @returns Observable<BusinessMetrics> with all business data
   */
  getBusinessMetrics(): Observable<BusinessMetrics> {
    console.log('📊 Fetching business metrics...');

    return forkJoin({
      totalUsers: this.getTotalUsers(),
      totalGames: this.getTotalGames(),
      totalSales: this.getTotalSales(),
      totalRevenue: this.getTotalRevenue()
    }).pipe(
      map(metrics => {
        console.log('📊 Business metrics loaded:', metrics);
        return metrics;
      }),
      catchError(error => {
        console.error('❌ Error loading business metrics:', error);
        // Return default values if any API fails
        return of({
          totalUsers: 0,
          totalGames: 0,
          totalSales: 0,
          totalRevenue: 0
        });
      })
    );
  }

  /**
   * Get total number of users
   * @returns Observable<number> total user count
   */
  private getTotalUsers(): Observable<number> {
    return this.adminOnlyService.getUsers(1, 1).pipe(
      map(response => response.totalCount),
      catchError(error => {
        console.error('❌ Error getting total users:', error);
        return of(0);
      })
    );
  }

  /**
   * Get total number of games
   * @returns Observable<number> total game count
   */
  private getTotalGames(): Observable<number> {
    return this.marketplaceService.getGames().pipe(
      map(games => games.length),
      catchError(error => {
        console.error('❌ Error getting total games:', error);
        return of(0);
      })
    );
  }

  /**
   * Get total number of sales (purchases)
   * Note: This is a simplified implementation. In a real app, you'd have a dedicated sales endpoint
   * @returns Observable<number> total sales count
   */
  private getTotalSales(): Observable<number> {
    // For MVP, we'll get all users and check their libraries
    // In a real implementation, you'd have a dedicated sales/purchases endpoint
    return this.adminOnlyService.getUsers(1, 1000).pipe(
      map(response => {
        // This is a simplified approach - in reality you'd have a dedicated sales endpoint
        // For now, we'll return 0 and let the admin know this needs a proper sales API
        console.log('📊 Total sales calculation needs dedicated sales API endpoint');
        return 0;
      }),
      catchError(error => {
        console.error('❌ Error getting total sales:', error);
        return of(0);
      })
    );
  }

  /**
   * Get total revenue from all sales
   * Note: This is a simplified implementation. In a real app, you'd have a dedicated revenue endpoint
   * @returns Observable<number> total revenue
   */
  private getTotalRevenue(): Observable<number> {
    // For MVP, we'll return 0 and let the admin know this needs a proper revenue API
    // In a real implementation, you'd have a dedicated revenue/sales endpoint
    console.log('📊 Total revenue calculation needs dedicated revenue API endpoint');
    return of(0);
  }

  /**
   * Get sales data for a specific user (for testing purposes)
   * @param userId User ID to get sales for
   * @returns Observable<number> number of games purchased by user
   */
  getUserSalesCount(userId: string): Observable<number> {
    return this.gameLibraryService.getUserLibrary(userId).pipe(
      map(library => library.length),
      catchError(error => {
        console.error('❌ Error getting user sales count:', error);
        return of(0);
      })
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
    console.error('Business metrics service error:', error);

    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please make sure the API is running.';
    } else if (error.status === 400) {
      errorMessage = 'Bad request. Please check your input.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'Forbidden. Admin access required.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    return throwError(() => new Error(errorMessage));
  };
}
