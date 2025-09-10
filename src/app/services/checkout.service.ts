import { Injectable } from '@angular/core';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { PaymentService, CreateCustomerDto, CreateProductDto } from './payment.service';
import { CartService, CartItem } from './cart.service';
import { AuthService } from './auth.service';
import { MarketplaceService, GameDto } from './marketplace.service';
import { UserDto } from '../models/user.model';

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  constructor(
    private paymentService: PaymentService,
    private cartService: CartService,
    private authService: AuthService,
    private marketplaceService: MarketplaceService
  ) {}

  processCheckout(): Observable<CheckoutResult> {
    const currentUser = this.authService.getCurrentUserValue();
    const cartItems = this.cartService.getCartItems();

    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    if (cartItems.length === 0) {
      return throwError(() => new Error('Cart is empty'));
    }

    // Step 1: Ensure customer exists in Stripe
    return this.ensureCustomerExists(currentUser).pipe(
      switchMap(customerId => {
        // Step 2: Ensure all products exist in Stripe
        return this.ensureProductsExist(cartItems).pipe(
          switchMap(productIds => {
            // Step 3: Create checkout session
            return this.paymentService.createCheckoutSession(customerId, productIds).pipe(
              map(checkoutSession => ({
                success: true,
                checkoutUrl: checkoutSession.url // Direct redirect to Stripe checkout session
              })),
              catchError(error => {
                console.error('Checkout session creation failed:', error);
                if (error.message === 'Payment service unavailable') {
                  return of({
                    success: false,
                    error: 'Payment service is currently unavailable. Please make sure the FCG_MS_Payments API is running.'
                  });
                }
                return of({
                  success: false,
                  error: 'Unable to finalize the checkout since it\'s a MVP'
                });
              })
            );
          }),
          catchError(error => {
            console.error('Product creation failed:', error);
            if (error.message === 'Payment service unavailable') {
              return of({
                success: false,
                error: 'Payment service is currently unavailable. Please make sure the FCG_MS_Payments API is running.'
              });
            }
            return of({
              success: false,
              error: 'Unable to finalize the checkout since it\'s a MVP'
            });
          })
        );
      }),
      catchError(error => {
        console.error('Customer creation failed:', error);
        if (error.message === 'Payment service unavailable') {
          return of({
            success: false,
            error: 'Payment service is currently unavailable. Please make sure the FCG_MS_Payments API is running.'
          });
        }
        return of({
          success: false,
          error: 'Unable to finalize the checkout since it\'s a MVP'
        });
      })
    );
  }

  private ensureCustomerExists(user: UserDto): Observable<string> {
    const customerData: CreateCustomerDto = {
      name: user.name,
      email: user.email,
      externalCustomerId: user.id,
      description: `Customer created from FCG Games - ${user.name}`
    };

    // First, try to get existing customer
    return this.paymentService.getCustomerByExternalId(user.id).pipe(
      map(customer => user.id), // Return the external customer ID (user ID), not Stripe customer ID
      catchError(error => {
        // If customer doesn't exist (404), create it
        if (error.status === 404) {
          return this.paymentService.createCustomer(customerData).pipe(
            map(customer => user.id) // Return the external customer ID (user ID), not Stripe customer ID
          );
        }
        // For network errors (API not running), throw a specific error
        if (error.status === 0) {
          throw new Error('Payment service unavailable');
        }
        // For other errors, re-throw
        throw error;
      })
    );
  }

  private ensureProductsExist(cartItems: CartItem[]): Observable<string[]> {
    // Create observables for each product check/create
    const productObservables = cartItems.map(item =>
      this.ensureProductExists(item.game)
    );

    // Execute all product checks/creates in parallel
    return forkJoin(productObservables);
  }

  private ensureProductExists(game: GameDto): Observable<string> {
    const productData: CreateProductDto = {
      name: game.title,
      description: game.description,
      price: game.price,
      currency: 'USD',
      externalProductId: game.id,
      imageUrl: game.coverImageUrl
    };

    // First, try to get existing product
    return this.paymentService.getProductByExternalId(game.id).pipe(
      map(product => game.id), // Return the external product ID (game ID) for checkout API
      catchError(error => {
        // If product doesn't exist (404), create it
        if (error.status === 404) {
          return this.paymentService.createProduct(productData).pipe(
            map(product => game.id) // Return the external product ID (game ID) for checkout API
          );
        }
        // For network errors (API not running), throw a specific error
        if (error.status === 0) {
          throw new Error('Payment service unavailable');
        }
        // For other errors, re-throw
        throw error;
      })
    );
  }
}
