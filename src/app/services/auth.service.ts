import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { RegisterUserDto, LoginDto, UserDto, AuthResponse } from '../models/user.model';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.loadStoredUser();

    // Make debug methods available globally for console access
    (window as any).clearUserData = () => this.clearAllData();
    (window as any).debugUserData = () => this.debugStoredData();
  }

  private getApiBaseUrl(): string {
    try {
      return this.configService.getApiUrl('userApi') + '/api';
    } catch (error) {
      // Fallback to localhost if config not loaded yet
      return 'http://localhost:5010/api';
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  private getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('jwt_token');
  }

  private loadStoredUser(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  register(userData: RegisterUserDto): Observable<any> {
    return this.http.post(`${this.getApiBaseUrl()}/user/register`, userData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    console.log('Attempting login with credentials:', credentials);
    console.log('API URL:', `${this.getApiBaseUrl()}/userauthorization/token`);

    return this.http.post(`${this.getApiBaseUrl()}/userauthorization/token`, credentials, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'text'
    }).pipe(
      switchMap((response: string) => {

        // Check if it's an error message
        if (response.includes('User does not exist') ||
            response.includes('Invalid credentials') ||
            response.includes('User does not have permission')) {
          throw new Error(response);
        }

        // API returns just the token string
        const token = response;
        console.log('🎫 Token received, storing in localStorage');
        this.setToken(token);

        // Fetch user details with the new token
        console.log('👤 Fetching user details with token...');
        return this.getCurrentUserWithToken(token).pipe(
          map(user => {
            console.log('✅ User details fetched successfully:', user);
            return { token, user };
          }),
          catchError(error => {
            console.error('❌ Error fetching user details:', error);
            throw error;
          })
        );
      }),
      catchError(error => {
        console.error('Login error details:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error statusText:', error.statusText);
        return this.handleError(error);
      })
    );
  }

  getCurrentUser(): Observable<UserDto> {
    return this.http.get(`${this.getApiBaseUrl()}/user/id`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => {
        const user: UserDto = {
          id: response.id,
          name: response.name,
          email: response.email,
          permission: response.permission
        };
        this.currentUserSubject.next(user);
        localStorage.setItem('current_user', JSON.stringify(user));
        return user;
      }),
      catchError(this.handleError)
    );
  }

  getCurrentUserWithToken(token: string): Observable<UserDto> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Decode the JWT token to get user information
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Extract user ID from JWT token (preferred) or name as fallback
    const userId = payload.sub || payload.user_id || payload.id;
    const email = payload.email;
    const name = payload.unique_name;

    if (!userId && !email && !name) {
      return throwError(() => new Error('User ID, email, or name not found in JWT token'));
    }

    // Use the user ID endpoint if available, otherwise fall back to email or name search
    let endpoint;
    if (userId) {
      endpoint = `${this.getApiBaseUrl()}/user/id?id=${userId}`;
    } else if (email) {
      endpoint = `${this.getApiBaseUrl()}/user?email=${encodeURIComponent(email)}`;
    } else if (name) {
      endpoint = `${this.getApiBaseUrl()}/user?name=${encodeURIComponent(name)}`;
    } else {
      return throwError(() => new Error('No valid user identifier found in JWT token'));
    }

    return this.http.get(endpoint, {
      headers: headers
    }).pipe(
      map((response: any) => {

        let userData;

        // Handle different response formats
        if (userId) {
          // Direct user object from /user/id endpoint
          userData = response;
        } else {
          // Array response from /user?email endpoint
          if (!response || !Array.isArray(response) || response.length === 0) {
            throw new Error('User not found');
          }
          userData = response[0];
        }

        const user: UserDto = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          permission: userData.permission
        };
        this.currentUserSubject.next(user);
        localStorage.setItem('current_user', JSON.stringify(user));
        return user;
      }),
      catchError(error => {
        console.error('Error in getCurrentUserWithToken:', error);
        return this.handleError(error);
      })
    );
  }

  updateUser(userData: any): Observable<any> {
    return this.http.put(`${this.getApiBaseUrl()}/user`, userData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.removeToken();
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  /**
   * Validates if the current user exists in the Game Library API
   * If not, clears the session and redirects to login
   */
  validateUserInGameLibrary(): Observable<boolean> {
    const currentUser = this.getCurrentUserValue();
    if (!currentUser) {
      return of(false);
    }

    // Import GameLibraryService dynamically to avoid circular dependency
    return this.http.get(`${this.configService.getApiUrl('gameLibraryApi')}/api/users/${currentUser.id}/library`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => true), // User exists
      catchError(error => {
        if (error.status === 404) {
          console.log('🔄 User not found in Game Library API, clearing session');
          this.logout();
          return of(false);
        }
        return of(true); // Other errors, assume user exists
      })
    );
  }

  /**
   * Clears all stored data (useful for debugging)
   */
  clearAllData(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    console.log('🧹 All user data cleared from localStorage');
  }

  /**
   * Debug method to show current stored data
   */
  debugStoredData(): void {
    const token = localStorage.getItem('jwt_token');
    const user = localStorage.getItem('current_user');

    console.log('🔍 Current stored data:');
    console.log('JWT Token:', token ? 'Present' : 'Not found');
    console.log('Current User:', user ? JSON.parse(user) : 'Not found');

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload);
      } catch (e) {
        console.log('JWT Token is invalid');
      }
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(payload.exp * 1000);
      if (expirationDate < new Date()) {
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  getCurrentUserValue(): UserDto | null {
    return this.currentUserSubject.value;
  }

  private handleError(error: any): Observable<never> {
    console.error('AuthService error:', error); // Debug log

    let errorMessage = 'An error occurred';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Final error message:', errorMessage); // Debug log
    return throwError(() => new Error(errorMessage));
  }
}
