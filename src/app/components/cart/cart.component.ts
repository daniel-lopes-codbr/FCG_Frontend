import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CartService, CartItem } from '../../services/cart.service';
import { UserDto } from '../../models/user.model';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  currentUser: UserDto | null = null;
  darkMode$ = this.themeService.darkMode$;

  cartItems: CartItem[] = [];
  cartTotal = 0;
  cartItemCount = 0;

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
    } else if (this.currentUser.permission === 'Admin') {
      // Redirect admin users to admin panel
      this.router.navigate(['/admin']);
    } else {
      this.loadCartData();
    }
  }

  loadCartData(): void {
    this.cartItems = this.cartService.getCartItems();
    this.cartTotal = this.cartService.getCartTotal();
    this.cartItemCount = this.cartService.getCartItemCount();
  }

  removeFromCart(gameId: string): void {
    this.cartService.removeFromCart(gameId);
    this.loadCartData(); // Refresh cart data
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
      this.cartService.clearCart();
      this.loadCartData(); // Refresh cart data
    }
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Your cart is empty. Please add some games before proceeding to checkout.');
      return;
    }

    // TODO: Implement actual checkout flow in Step 3
    alert(`Proceeding to checkout with ${this.cartItemCount} item(s) totaling ${this.getCartTotalFormatted()}. Checkout integration coming in Step 3!`);
  }

  continueShopping(): void {
    this.router.navigate(['/marketplace']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getCartTotalFormatted(): string {
    return this.cartService.getCartTotalFormatted();
  }

  getGenreBadgeClass(genre: string): string {
    const genreColors: { [key: string]: string } = {
      'Action': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Adventure': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'RPG': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Strategy': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Sports': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Puzzle': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Simulation': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'Horror': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'MMO': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'FPS': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
    };

    return genreColors[genre] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/300x400/1f2937/ffffff?text=No+Image';
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToMarketplace(): void {
    this.router.navigate(['/marketplace']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
