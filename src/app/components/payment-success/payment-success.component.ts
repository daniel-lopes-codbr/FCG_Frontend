import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckoutService } from '../../services/checkout.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  isProcessing = true;
  isSuccess = false;
  isError = false;
  errorMessage = '';
  purchasedGames: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private checkoutService: CheckoutService,
    private authService: AuthService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.handlePaymentSuccess();
  }

  private handlePaymentSuccess(): void {
    // Check if this is a successful payment return
    const success = this.route.snapshot.queryParams['success'];

    if (success === 'true') {
      console.log('🎉 Payment success detected, processing...');
      this.processSuccessfulPayment();
    } else {
      console.log('❌ No success parameter found, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    }
  }

  private processSuccessfulPayment(): void {
    const currentUser = this.authService.getCurrentUserValue();

    if (!currentUser) {
      console.error('❌ No current user found');
      this.handleError('User not found. Please log in again.');
      return;
    }

    // Get the games that were in the cart (we'll need to store this before redirect)
    // For MVP, we'll get the current cart items, but in a real app, we'd store this in session/localStorage
    const cartItems = this.cartService.getCartItems();
    const gameIds = cartItems.map(item => item.game.id);

    if (gameIds.length === 0) {
      console.log('📚 No games found in cart, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    console.log('📚 Processing purchase registration for games:', gameIds);

    // Register the purchases in the Game Library
    this.checkoutService.handleSuccessfulPayment(currentUser.id, gameIds).subscribe({
      next: (success) => {
        this.isProcessing = false;
        if (success) {
          this.isSuccess = true;
          this.purchasedGames = gameIds;
          console.log('✅ Purchase registration completed successfully');

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 3000);
        } else {
          this.handleError('Payment was successful, but there was an issue registering your games. Please contact support.');
        }
      },
      error: (error) => {
        console.error('❌ Error during purchase registration:', error);
        this.handleError('Payment was successful, but there was an issue registering your games. Please contact support.');
      }
    });
  }

  private handleError(message: string): void {
    this.isProcessing = false;
    this.isError = true;
    this.errorMessage = message;

    // Redirect to dashboard after 5 seconds
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 5000);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
