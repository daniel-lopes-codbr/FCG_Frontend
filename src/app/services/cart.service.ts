import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameDto } from './marketplace.service';

export interface CartItem {
  game: GameDto;
  quantity: number; // Always 1 for MVP
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {}

  // Get current cart items
  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  // Get cart items as observable
  getCartItemsObservable(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  // Add game to cart (only one of each game for MVP)
  addToCart(game: GameDto): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItem = currentItems.find(item => item.game.id === game.id);

    if (existingItem) {
      // Game already in cart, show message (for MVP, we don't allow multiple quantities)
      console.log(`Game "${game.title}" is already in your cart`);
      return;
    }

    // Add new game to cart
    const newItem: CartItem = {
      game: game,
      quantity: 1
    };

    const updatedItems = [...currentItems, newItem];
    this.cartItemsSubject.next(updatedItems);
    console.log(`Added "${game.title}" to cart`);
  }

  // Remove game from cart
  removeFromCart(gameId: string): void {
    const currentItems = this.cartItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.game.id !== gameId);
    this.cartItemsSubject.next(updatedItems);
  }

  // Clear entire cart
  clearCart(): void {
    this.cartItemsSubject.next([]);
  }

  // Get total number of items in cart
  getCartItemCount(): number {
    return this.cartItemsSubject.value.length;
  }

  // Get total price of cart
  getCartTotal(): number {
    return this.cartItemsSubject.value.reduce((total, item) => {
      return total + (item.game.price * item.quantity);
    }, 0);
  }

  // Check if game is in cart
  isGameInCart(gameId: string): boolean {
    return this.cartItemsSubject.value.some(item => item.game.id === gameId);
  }

  // Get cart total as formatted string
  getCartTotalFormatted(): string {
    const total = this.getCartTotal();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(total);
  }
}
