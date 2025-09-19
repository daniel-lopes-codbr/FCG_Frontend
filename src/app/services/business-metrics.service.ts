import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, timeout, switchMap } from 'rxjs/operators';
import { AdminOnlyService } from './admin-only.service';
import { MarketplaceService } from './marketplace.service';
import { GameLibraryService } from './game-library.service';
import { ConfigService } from './config.service';

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
  constructor(
    private http: HttpClient,
    private adminOnlyService: AdminOnlyService,
    private marketplaceService: MarketplaceService,
    private gameLibraryService: GameLibraryService,
    private configService: ConfigService
  ) {}

  private getUserApiBaseUrl(): string {
    try {
      return this.configService.getApiUrl('userApi') + '/api';
    } catch (error) {
      // Fallback to localhost if config not loaded yet
      return 'http://localhost:5010/api';
    }
  }

  private getGameLibraryApiBaseUrl(): string {
    try {
      return this.configService.getApiUrl('gameLibraryApi') + '/api';
    } catch (error) {
      // Fallback to localhost if config not loaded yet
      return 'http://localhost:5011/api';
    }
  }

  /**
   * Get comprehensive business metrics for admin dashboard
   * @returns Observable<BusinessMetrics> with all business data
   */
  getBusinessMetrics(): Observable<BusinessMetrics> {
    return forkJoin({
      totalUsers: this.getTotalUsers(),
      totalGames: this.getTotalGames(),
      totalSales: this.getTotalSalesMVP(), // Use MVP version
      totalRevenue: this.getTotalRevenueMVP() // Use MVP version
    }).pipe(
      map(metrics => {
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
   * @deprecated This method loops through all users and makes individual API calls - use getTotalSalesMVP() instead
   * Note: This is a simplified implementation. In a real app, you'd have a dedicated sales endpoint
   * @returns Observable<number> total sales count
   */
  private getTotalSales(): Observable<number> {
    // Get all users and count total purchases across all libraries
    return this.adminOnlyService.getUsers(1, 1000).pipe(
      switchMap(usersResponse => {
        const users = usersResponse.data;

        if (users.length === 0) {
          return of(0);
        }

        // Get library data for all users in parallel
        const libraryObservables = users.map((user: any) =>
          this.gameLibraryService.getUserLibrary(user.id).pipe(
            map(library => library.length), // Count of games in library
            catchError(error => {
              if (error.status === 404) {
                console.warn(`⚠️ User ${user.id} (${user.name || user.email}) not found in Game Library API - skipping`);
              } else {
                console.error(`❌ Error getting library for user ${user.id}:`, error);
              }
              return of(0); // Return 0 if we can't get this user's library
            })
          )
        );

        return forkJoin(libraryObservables).pipe(
          map((userSales: number[]) => {
            const totalSales = userSales.reduce((total: number, userSale: number) => total + userSale, 0);
            return totalSales;
          })
        );
      }),
      catchError(error => {
        console.error('❌ Error getting total sales:', error);
        return of(0);
      })
    );
  }

  /**
   * Get total revenue from all sales
   * @deprecated This method loops through all users and makes individual API calls - use getTotalRevenueMVP() instead
   * Calculates revenue by aggregating purchase prices from all users' libraries
   * @returns Observable<number> total revenue
   */
  private getTotalRevenue(): Observable<number> {
    // Get all users first
    return this.adminOnlyService.getUsers(1, 1000).pipe(
      switchMap(usersResponse => {
        const users = usersResponse.data;

        if (users.length === 0) {
          return of(0);
        }

        // Get library data for all users in parallel
        const libraryObservables = users.map((user: any) =>
          this.gameLibraryService.getUserLibrary(user.id).pipe(
            map(library => library.reduce((total: number, game: any) => total + game.purchasePrice, 0)),
            catchError(error => {
              if (error.status === 404) {
                console.warn(`⚠️ User ${user.id} (${user.name || user.email}) not found in Game Library API - skipping`);
              } else {
                console.error(`❌ Error getting library for user ${user.id}:`, error);
              }
              return of(0); // Return 0 if we can't get this user's library
            })
          )
        );

        return forkJoin(libraryObservables).pipe(
          map((userRevenues: number[]) => {
            const totalRevenue = userRevenues.reduce((total: number, userRevenue: number) => total + userRevenue, 0);
            return totalRevenue;
          })
        );
      }),
      catchError(error => {
        console.error('❌ Error getting total revenue:', error);
        return of(0);
      })
    );
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
        if (error.status === 404) {
          console.warn(`⚠️ User ${userId} not found in Game Library API`);
        } else {
          console.error('❌ Error getting user sales count:', error);
        }
        return of(0);
      })
    );
  }

  /**
   * MVP version: Get total sales count without looping through users
   * For MVP, we'll use a simple calculation or mock data
   * @returns Observable<number> total sales count
   */
  private getTotalSalesMVP(): Observable<number> {
    // For MVP, return a reasonable estimate based on total users
    // In the future, this should be replaced with a proper API endpoint
    return this.getTotalUsers().pipe(
      map(totalUsers => {
        // Estimate: assume 20% of users have made purchases with average 2 games each
        const estimatedSales = Math.floor(totalUsers * 0.2 * 2);
        console.log(`📊 MVP: Estimated total sales: ${estimatedSales} (based on ${totalUsers} users)`);
        return estimatedSales;
      }),
      catchError(error => {
        console.warn('⚠️ Error getting total users for sales estimate, using default value');
        return of(0);
      })
    );
  }

  /**
   * MVP version: Get total revenue without looping through users
   * For MVP, we'll use a simple calculation or mock data
   * @returns Observable<number> total revenue
   */
  private getTotalRevenueMVP(): Observable<number> {
    // For MVP, return a reasonable estimate based on total sales
    // In the future, this should be replaced with a proper API endpoint
    return this.getTotalSalesMVP().pipe(
      map(totalSales => {
        // Estimate: assume average game price of $25
        const estimatedRevenue = totalSales * 25;
        console.log(`💰 MVP: Estimated total revenue: $${estimatedRevenue} (based on ${totalSales} sales)`);
        return estimatedRevenue;
      }),
      catchError(error => {
        console.warn('⚠️ Error getting total sales for revenue estimate, using default value');
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
