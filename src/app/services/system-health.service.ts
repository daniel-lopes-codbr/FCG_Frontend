import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';

export interface HealthCheck {
  name: string;
  status: string;
  exception?: string;
  duration: number;
}

export interface HealthStatus {
  status: string;
  checks: HealthCheck[];
}

export interface ApiHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
  error?: string;
  healthDetails?: HealthStatus;
}

export interface SystemHealthOverview {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  apis: ApiHealth[];
  totalApis: number;
  healthyApis: number;
  unhealthyApis: number;
  averageResponseTime: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SystemHealthService {
  private readonly API_ENDPOINTS = [
    {
      name: 'User Management API',
      baseUrl: 'http://localhost:3002/api',
      healthUrl: 'http://localhost:3002/api/health',
      authType: 'jwt' as const
    },
    {
      name: 'Game Library API',
      baseUrl: 'http://localhost:3001/api',
      healthUrl: 'http://localhost:3001/api/health',
      authType: 'jwt' as const
    },
    {
      name: 'Payments API',
      baseUrl: 'http://localhost:5043/api',
      healthUrl: 'http://localhost:5043/api/health',
      authType: 'apikey' as const
    }
  ];

  constructor(private http: HttpClient) { }

  /**
   * Get comprehensive system health overview
   * @returns Observable<SystemHealthOverview> Complete system health status
   */
  getSystemHealthOverview(): Observable<SystemHealthOverview> {
    console.log('🏥 Checking system health...');

    const healthChecks = this.API_ENDPOINTS.map(endpoint =>
      this.checkApiHealth(endpoint.name, endpoint.healthUrl, endpoint.authType)
    );

    return forkJoin(healthChecks).pipe(
      map(apiHealths => {
        const healthyApis = apiHealths.filter(api => api.status === 'healthy').length;
        const unhealthyApis = apiHealths.filter(api => api.status === 'unhealthy').length;
        const totalApis = apiHealths.length;

        let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
        if (unhealthyApis === 0) {
          overallStatus = 'healthy';
        } else if (unhealthyApis < totalApis) {
          overallStatus = 'degraded';
        } else {
          overallStatus = 'unhealthy';
        }

        const averageResponseTime = apiHealths.reduce((sum, api) => sum + api.responseTime, 0) / totalApis;

        const overview: SystemHealthOverview = {
          overallStatus,
          apis: apiHealths,
          totalApis,
          healthyApis,
          unhealthyApis,
          averageResponseTime,
          lastUpdated: new Date()
        };

        console.log('🏥 System health overview:', overview);
        return overview;
      }),
      catchError(error => {
        console.error('❌ Error getting system health overview:', error);
        // Return a degraded status if we can't check any APIs
        return of({
          overallStatus: 'unhealthy' as const,
          apis: [],
          totalApis: this.API_ENDPOINTS.length,
          healthyApis: 0,
          unhealthyApis: this.API_ENDPOINTS.length,
          averageResponseTime: 0,
          lastUpdated: new Date()
        } as SystemHealthOverview);
      })
    );
  }

  /**
   * Check health of a specific API
   * @param apiName Name of the API
   * @param healthUrl Health check URL
   * @param authType Authentication type ('jwt' or 'apikey')
   * @returns Observable<ApiHealth> API health status
   */
  private checkApiHealth(apiName: string, healthUrl: string, authType: 'jwt' | 'apikey'): Observable<ApiHealth> {
    const startTime = Date.now();

    return this.http.get<HealthStatus>(healthUrl, {
      headers: this.getHeaders(authType)
    }).pipe(
      timeout(5000), // 5 second timeout
      map(response => {
        const responseTime = Date.now() - startTime;
        return {
          name: apiName,
          url: healthUrl,
          status: response.status === 'Healthy' ? 'healthy' : 'unhealthy',
          responseTime,
          lastChecked: new Date(),
          healthDetails: response
        } as ApiHealth;
      }),
      catchError(error => {
        const responseTime = Date.now() - startTime;
        console.error(`❌ Health check failed for ${apiName}:`, error);

        return of({
          name: apiName,
          url: healthUrl,
          status: 'unhealthy',
          responseTime,
          lastChecked: new Date(),
          error: this.getErrorMessage(error)
        } as ApiHealth);
      })
    );
  }

  /**
   * Get health status of a specific API
   * @param apiName Name of the API to check
   * @returns Observable<ApiHealth> Specific API health
   */
  getApiHealth(apiName: string): Observable<ApiHealth> {
    const endpoint = this.API_ENDPOINTS.find(ep => ep.name === apiName);
    if (!endpoint) {
      return throwError(() => new Error(`API ${apiName} not found`));
    }

    return this.checkApiHealth(endpoint.name, endpoint.healthUrl, endpoint.authType);
  }

  /**
   * Get all available API endpoints
   * @returns Array of API endpoint information
   */
  getAvailableApis(): Array<{name: string, baseUrl: string, healthUrl: string}> {
    return this.API_ENDPOINTS;
  }

  /**
   * Refresh system health (re-check all APIs)
   * @returns Observable<SystemHealthOverview> Updated system health
   */
  refreshSystemHealth(): Observable<SystemHealthOverview> {
    console.log('🔄 Refreshing system health...');
    return this.getSystemHealthOverview();
  }

  private getHeaders(authType: 'jwt' | 'apikey'): HttpHeaders {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (authType === 'jwt') {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('No JWT token found');
      }
      return headers.set('Authorization', `Bearer ${token}`);
    } else if (authType === 'apikey') {
      // Use the same API key as PaymentService
      const apiKey = 'your-secure-api-key-here';
      return headers.set('X-API-Key', apiKey);
    }

    return headers;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Network error - API may be down';
    } else if (error.status === 401) {
      return 'Unauthorized - Check authentication';
    } else if (error.status === 404) {
      return 'Health endpoint not found';
    } else if (error.status >= 500) {
      return 'Server error';
    } else {
      return error.message || 'Unknown error';
    }
  }
}
