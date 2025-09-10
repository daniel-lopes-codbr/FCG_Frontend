import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { AdminOnlyService } from './admin-only.service';
import { MarketplaceService } from './marketplace.service';

export interface RecentActivity {
  type: 'user_registration' | 'game_addition' | 'purchase' | 'system_event';
  description: string;
  timestamp: Date;
  details?: any;
}

export interface OperationalMetrics {
  recentUserRegistrations: number;
  recentGameAdditions: number;
  recentSales: number;
  systemUptime: string;
  averageResponseTime: number;
  errorRate: number;
  recentActivities: RecentActivity[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OperationalMetricsService {
  private readonly USER_API_BASE_URL = 'http://localhost:3002/api';
  private readonly GAME_LIBRARY_API_BASE_URL = 'http://localhost:3001/api';

  constructor(
    private http: HttpClient,
    private adminOnlyService: AdminOnlyService,
    private marketplaceService: MarketplaceService
  ) { }

  /**
   * Get comprehensive operational metrics
   * @returns Observable<OperationalMetrics> Operational data
   */
  getOperationalMetrics(): Observable<OperationalMetrics> {
    return forkJoin({
      recentUsers: this.getRecentUserRegistrations(),
      recentGames: this.getRecentGameAdditions(),
      recentSales: this.getRecentSales(),
      systemUptime: this.getSystemUptime(),
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate()
    }).pipe(
      map(data => {
        const metrics: OperationalMetrics = {
          recentUserRegistrations: data.recentUsers,
          recentGameAdditions: data.recentGames,
          recentSales: data.recentSales,
          systemUptime: data.systemUptime,
          averageResponseTime: data.averageResponseTime,
          errorRate: data.errorRate,
          recentActivities: this.generateRecentActivities(data),
          lastUpdated: new Date()
        };

        return metrics;
      }),
      catchError(error => {
        console.error('❌ Error loading operational metrics:', error);
        // Return default values if any API fails
        return of({
          recentUserRegistrations: 0,
          recentGameAdditions: 0,
          recentSales: 0,
          systemUptime: 'Unknown',
          averageResponseTime: 0,
          errorRate: 0,
          recentActivities: [],
          lastUpdated: new Date()
        });
      })
    );
  }

  /**
   * Get recent user registrations (last 24 hours)
   * @returns Observable<number> Number of recent registrations
   */
  private getRecentUserRegistrations(): Observable<number> {
    // For MVP, we'll get all users and estimate recent registrations
    // In a real implementation, you'd have a dedicated endpoint for recent registrations
    return this.adminOnlyService.getUsers(1, 1000).pipe(
      map(response => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Since we don't have creation dates in the current API,
        // we'll return a placeholder value
        return 0; // Placeholder
      }),
      catchError(error => {
        console.error('❌ Error getting recent user registrations:', error);
        return of(0);
      })
    );
  }

  /**
   * Get recent game additions (last 24 hours)
   * @returns Observable<number> Number of recent game additions
   */
  private getRecentGameAdditions(): Observable<number> {
    // For MVP, we'll get all games and estimate recent additions
    // In a real implementation, you'd have a dedicated endpoint for recent games
    return this.marketplaceService.getGames().pipe(
      map(games => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Count games added in the last 24 hours
        const recentGames = games.filter(game => {
          const gameDate = new Date(game.releaseDate);
          return gameDate >= yesterday;
        });

        return recentGames.length;
      }),
      catchError(error => {
        console.error('❌ Error getting recent game additions:', error);
        return of(0);
      })
    );
  }

  /**
   * Get recent sales (last 24 hours)
   * @returns Observable<number> Number of recent sales
   */
  private getRecentSales(): Observable<number> {
    // For MVP, we'll return a placeholder
    // In a real implementation, you'd have a dedicated sales endpoint
    return of(0);
  }

  /**
   * Get system uptime
   * @returns Observable<string> System uptime string
   */
  private getSystemUptime(): Observable<string> {
    // For MVP, we'll return a placeholder
    // In a real implementation, you'd get this from system monitoring
    return of('99.9%');
  }

  /**
   * Get average response time across all APIs
   * @returns Observable<number> Average response time in milliseconds
   */
  private getAverageResponseTime(): Observable<number> {
    // For MVP, we'll return a placeholder
    // In a real implementation, you'd measure actual response times
    return of(150); // Placeholder: 150ms
  }

  /**
   * Get error rate percentage
   * @returns Observable<number> Error rate percentage
   */
  private getErrorRate(): Observable<number> {
    // For MVP, we'll return a placeholder
    // In a real implementation, you'd calculate from logs
    return of(0.1); // Placeholder: 0.1%
  }

  /**
   * Generate recent activities based on metrics
   * @param data Operational data
   * @returns Array of recent activities
   */
  private generateRecentActivities(data: any): RecentActivity[] {
    const activities: RecentActivity[] = [];
    const now = new Date();

    // Add sample activities based on available data
    if (data.recentUsers > 0) {
      activities.push({
        type: 'user_registration',
        description: `${data.recentUsers} new user(s) registered in the last 24 hours`,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        details: { count: data.recentUsers }
      });
    }

    if (data.recentGames > 0) {
      activities.push({
        type: 'game_addition',
        description: `${data.recentGames} new game(s) added in the last 24 hours`,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        details: { count: data.recentGames }
      });
    }

    if (data.recentSales > 0) {
      activities.push({
        type: 'purchase',
        description: `${data.recentSales} new purchase(s) in the last 24 hours`,
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        details: { count: data.recentSales }
      });
    }

    // Add system events
    activities.push({
      type: 'system_event',
      description: 'System health check completed',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      details: { status: 'healthy' }
    });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get quick system status
   * @returns Observable<{status: string, message: string}> Quick status
   */
  getQuickSystemStatus(): Observable<{status: string, message: string}> {
    return this.getOperationalMetrics().pipe(
      map(metrics => {
        if (metrics.errorRate > 5) {
          return {
            status: 'warning',
            message: 'High error rate detected'
          };
        } else if (metrics.averageResponseTime > 1000) {
          return {
            status: 'warning',
            message: 'Slow response times detected'
          };
        } else {
          return {
            status: 'healthy',
            message: 'All systems operational'
          };
        }
      }),
      catchError(error => {
        return of({
          status: 'error',
          message: 'Unable to check system status'
        });
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
}
