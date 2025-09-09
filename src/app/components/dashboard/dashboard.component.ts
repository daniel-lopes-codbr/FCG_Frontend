import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CartService } from '../../services/cart.service';
import { UserDto } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: UserDto | null = null;
  darkMode$ = this.themeService.darkMode$;

  constructor(
    private authService: AuthService,
    public router: Router,
    private themeService: ThemeService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getPermissionBadgeClass(): string {
    if (!this.currentUser) return '';

    return this.currentUser.permission === 'Admin'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }

  getInitialLetter(): string {
    if (!this.currentUser?.name) return 'U';
    return this.currentUser.name.charAt(0).toUpperCase();
  }

  navigateToAdminPanel(): void {
    this.router.navigate(['/admin']);
  }

  navigateToMarketplace(): void {
    this.router.navigate(['/marketplace']);
  }

  getCartItemCount(): number {
    return this.cartService.getCartItemCount();
  }

  navigateToCart(): void {
    // TODO: Navigate to cart page (will be implemented in next step)
    alert(`Cart has ${this.getCartItemCount()} item(s). Cart page coming in next step!`);
  }
}
