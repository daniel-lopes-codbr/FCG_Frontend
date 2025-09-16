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
      this.processSuccessfulPayment();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private processSuccessfulPayment(): void {
    console.log('🎯 Starting payment success processing...');
    
    const currentUser = this.authService.getCurrentUserValue();
    console.log('👤 Current user:', currentUser);

    if (!currentUser) {
      console.error('❌ No current user found');
      this.handleError('User not found. Please log in again.');
      return;
    }

    // Get the games that were in the cart (now persisted in localStorage)
    const cartItems = this.cartService.getCartItems();
    console.log('🛒 Cart items from localStorage:', cartItems);
    console.log('🛒 Cart items count:', cartItems.length);
    
    const gameIds = cartItems.map(item => item.game.id);
    console.log('🎮 Game IDs to register:', gameIds);

    if (gameIds.length === 0) {
      console.log('⚠️ No games in cart, checking localStorage directly...');
      
      // Try to get cart from localStorage directly as a fallback
      const storedCart = localStorage.getItem('fcg_cart_items');
      console.log('🔍 Raw localStorage cart data:', storedCart);
      
      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          console.log('🔍 Parsed localStorage cart:', parsedCart);
          const fallbackGameIds = parsedCart.map((item: any) => item.game.id);
          console.log('🎮 Fallback Game IDs:', fallbackGameIds);
          
          if (fallbackGameIds.length > 0) {
            console.log('🚀 Using fallback game IDs for registration...');
            this.checkoutService.handleSuccessfulPayment(currentUser.id, fallbackGameIds).subscribe({
              next: (success) => {
                console.log('✅ Fallback purchase registration result:', success);
                this.isProcessing = false;
                if (success) {
                  this.isSuccess = true;
                  this.purchasedGames = fallbackGameIds;
                  console.log('🎉 All games registered successfully using fallback!');
                  // Clear the cart after successful registration
                  this.cartService.clearCart();
                  // Redirect to dashboard after 3 seconds
                  setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                  }, 3000);
                } else {
                  console.error('❌ Fallback purchase registration failed');
                  this.handleError('Payment was successful, but there was an issue registering your games. Please contact support.');
                }
              },
              error: (error) => {
                console.error('❌ Error during fallback purchase registration:', error);
                this.handleError('Payment was successful, but there was an issue registering your games. Please contact support.');
              }
            });
            return;
          }
        } catch (error) {
          console.error('❌ Error parsing localStorage cart:', error);
        }
      }
      
      console.log('⚠️ No games found in cart or localStorage, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    console.log('🚀 Starting game registration process...');
    console.log('📝 User ID:', currentUser.id);
    console.log('📝 Game IDs:', gameIds);

    // Register the purchases in the Game Library
    this.checkoutService.handleSuccessfulPayment(currentUser.id, gameIds).subscribe({
      next: (success) => {
        console.log('✅ Purchase registration result:', success);
        this.isProcessing = false;
        if (success) {
          this.isSuccess = true;
          this.purchasedGames = gameIds;
          console.log('🎉 All games registered successfully!');

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 3000);
        } else {
          console.error('❌ Purchase registration failed');
          this.handleError('Payment was successful, but there was an issue registering your games. Please contact support.');
        }
      },
      error: (error) => {
        console.error('❌ Error during purchase registration:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });
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
