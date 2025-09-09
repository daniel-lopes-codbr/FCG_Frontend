import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { RegisterUserDto, LoginDto, UserDto, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'http://localhost:3002/api';
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
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
    return this.http.post(`${this.API_BASE_URL}/user/register`, userData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    console.log('Attempting login with credentials:', credentials);
    console.log('API URL:', `${this.API_BASE_URL}/userauthorization/token`);

    return this.http.post(`${this.API_BASE_URL}/userauthorization/token`, credentials, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'text'
    }).pipe(
      tap(response => {
        console.log('Raw HTTP response:', response);
        console.log('Response type:', typeof response);
      }),
      switchMap((response: string) => {
        console.log('Login response:', response); // Debug log

        // Check if it's an error message
        if (response.includes('User does not exist') ||
            response.includes('Invalid credentials') ||
            response.includes('User does not have permission')) {
          throw new Error(response);
        }

        // API returns just the token string
        const token = response;
        this.setToken(token);

        // Fetch user details with the new token
        return this.getCurrentUserWithToken(token).pipe(
          map(user => ({ token, user })),
          catchError(error => {
            console.error('Error fetching user details:', error);
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
    return this.http.get(`${this.API_BASE_URL}/user/id`, {
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

    console.log('Fetching user with token:', token); // Debug log

    // Decode the JWT token to get user information
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('JWT payload:', payload);

    // Extract user ID from JWT token (preferred) or email as fallback
    const userId = payload.sub || payload.user_id || payload.id;
    const email = payload.email || payload.unique_name;

    if (!userId && !email) {
      return throwError(() => new Error('User ID or email not found in JWT token'));
    }

    // Use the user ID endpoint if available, otherwise fall back to email search
    const endpoint = userId
      ? `${this.API_BASE_URL}/user/id?id=${userId}`
      : `${this.API_BASE_URL}/user?email=${encodeURIComponent(email)}`;

    return this.http.get(endpoint, {
      headers: headers
    }).pipe(
      map((response: any) => {
        console.log('User response:', response); // Debug log

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
    return this.http.put(`${this.API_BASE_URL}/user`, userData, {
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
