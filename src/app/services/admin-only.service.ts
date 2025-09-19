import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, timeout, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  permission: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  confirmationPassword: string;
}

export interface UpdateUserDto {
  userId: string;
  name: string;
  email?: string;
}

export interface UserAuthorizationDto {
  userId: string;
  permission: number; // 0 = Admin, 1 = User
}

export interface GameDto {
  id: string;
  title: string;
  description: string;
  price: number;
  releaseDate: string;
  genre: string;
  coverImageUrl: string;
}

export interface CreateGameDto {
  title: string;
  description: string;
  price: number;
  releaseDate: string;
  genre: string;
  coverImageUrl: string;
}

export interface UpdateGameDto {
  title: string;
  description: string;
  price: number;
  genre: string;
  coverImageUrl: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOnlyService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
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

  private getGameApiBaseUrl(): string {
    try {
      return this.configService.getApiUrl('gameLibraryApi') + '/api';
    } catch (error) {
      // Fallback to localhost if config not loaded yet
      return 'http://localhost:5011/api';
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUserValue();
    return currentUser?.permission === 'Admin';
  }

  private checkAdminPermission(): void {
    if (!this.isAdmin()) {
      throw new Error('Access denied. Admin permission required.');
    }
  }

  // User Management Methods (Admin Only)
  createUser(userData: CreateUserDto): Observable<UserDto> {
    this.checkAdminPermission();

    return this.http.post(`${this.getUserApiBaseUrl()}/user/register`, userData, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map((response: any) => ({
        id: response.id,
        name: response.name,
        email: response.email,
        permission: response.permission
      })),
      catchError(this.handleError)
    );
  }

  getUsers(pageNumber: number = 1, pageSize: number = 10, email?: string, name?: string): Observable<PaginatedResponse<UserDto>> {
    this.checkAdminPermission();

    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (email) params = params.set('email', email);
    if (name) params = params.set('name', name);

    return this.http.get(`${this.getUserApiBaseUrl()}/user`, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      timeout(10000),
      map((response: any) => {
        // Since the current API doesn't have pagination, we'll simulate it
        const users = Array.isArray(response) ? response : [response];
        const totalCount = users.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedUsers = users.slice(startIndex, endIndex);

        return {
          data: paginatedUsers.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            permission: user.permission
          })),
          totalCount,
          pageSize,
          pageNumber,
          totalPages
        };
      }),
      catchError(this.handleError)
    );
  }

  getUserById(id: string): Observable<UserDto> {
    this.checkAdminPermission();

    return this.http.get(`${this.getUserApiBaseUrl()}/user/id?id=${id}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map((response: any) => ({
        id: response.id,
        name: response.name,
        email: response.email,
        permission: response.permission
      })),
      catchError(this.handleError)
    );
  }

  updateUser(userData: UpdateUserDto): Observable<UserDto> {
    this.checkAdminPermission();

    return this.http.put(`${this.getUserApiBaseUrl()}/user`, userData, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map((response: any) => ({
        id: response.id,
        name: response.name,
        email: response.email,
        permission: response.permission
      })),
      catchError(this.handleError)
    );
  }

  deleteUser(userId: string): Observable<void> {
    this.checkAdminPermission();

    return this.http.delete(`${this.getUserApiBaseUrl()}/user?userId=${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  // User Permission Management Methods (Admin Only)
  updateUserPermission(userId: string, permission: number): Observable<UserDto> {
    this.checkAdminPermission();

    const authData: UserAuthorizationDto = {
      userId: userId,
      permission: permission
    };

    return this.http.put(`${this.getUserApiBaseUrl()}/userauthorization/user-permissions`, authData, {
      headers: this.getHeaders(),
      responseType: 'text' // API returns plain text, not JSON
    }).pipe(
      timeout(10000),
      switchMap((response: string) => {
        console.log('Permission update response:', response);
        // For MVP: Just fetch the updated user data after the update
        return this.getUserById(userId);
      }),
      catchError((error) => {
        console.error('Permission update error:', error);
        // For MVP: If there's an error, just return the current user data
        return this.getUserById(userId);
      })
    );
  }

  // Game Management Methods (Admin Only)
  createGame(gameData: CreateGameDto): Observable<GameDto> {
    this.checkAdminPermission();

    return this.http.post(`${this.getGameApiBaseUrl()}/games`, gameData, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map((response: any) => ({
        id: response.id,
        title: response.title,
        description: response.description,
        price: response.price,
        releaseDate: response.releaseDate,
        genre: response.genre,
        coverImageUrl: response.coverImageUrl
      })),
      catchError(this.handleError)
    );
  }

  getGames(): Observable<GameDto[]> {
    this.checkAdminPermission();

    return this.http.get(`${this.getGameApiBaseUrl()}/games`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map((response: any) => {
        const games = Array.isArray(response) ? response : [response];
        return games.map((game: any) => ({
          id: game.id,
          title: game.title,
          description: game.description,
          price: game.price,
          releaseDate: game.releaseDate,
          genre: game.genre,
          coverImageUrl: game.coverImageUrl
        }));
      }),
      catchError(this.handleError)
    );
  }

  getGameById(id: string): Observable<GameDto> {
    this.checkAdminPermission();

    return this.http.get(`${this.getGameApiBaseUrl()}/games/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map((response: any) => ({
        id: response.id,
        title: response.title,
        description: response.description,
        price: response.price,
        releaseDate: response.releaseDate,
        genre: response.genre,
        coverImageUrl: response.coverImageUrl
      })),
      catchError(this.handleError)
    );
  }

  updateGame(id: string, gameData: UpdateGameDto): Observable<void> {
    this.checkAdminPermission();

    return this.http.put(`${this.getGameApiBaseUrl()}/games/${id}`, gameData, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  deleteGame(id: string): Observable<void> {
    this.checkAdminPermission();

    return this.http.delete(`${this.getGameApiBaseUrl()}/games/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('AdminOnlyService error:', error);

    let errorMessage = 'An error occurred';

    // Handle permission errors
    if (error.message && error.message.includes('Admin permission required')) {
      errorMessage = 'Access denied. Admin permission required.';
    }
    // Handle network errors (API not running)
    else if (error.status === 0 || error.name === 'HttpErrorResponse') {
      errorMessage = 'Unable to connect to the server. Please make sure the API is running.';
    }
    // Handle HTTP errors
    else if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server error (${error.status}). Please try again later.`;
      }
    }
    // Handle error messages from the API
    else if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
