import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.getCurrentUserValue();
      if (currentUser && currentUser.permission === 'Admin') {
        return true;
      }
    }

    // Redirect to dashboard if user is authenticated but not admin
    // Redirect to login if user is not authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
    return false;
  }
}
