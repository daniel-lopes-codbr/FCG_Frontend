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
  private readonly CART_STORAGE_KEY = 'fcg_cart_items';

  constructor() {
    this.loadCartFromStorage();
  }

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
      return;
    }

    // Add new game to cart
    const newItem: CartItem = {
      game: game,
      quantity: 1
    };

    const updatedItems = [...currentItems, newItem];
    this.updateCart(updatedItems);
  }

  // Remove game from cart
  removeFromCart(gameId: string): void {
    const currentItems = this.cartItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.game.id !== gameId);
    this.updateCart(updatedItems);
  }

  // Clear entire cart
  clearCart(): void {
    this.updateCart([]);
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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(total);
  }

  // Load cart from localStorage
  private loadCartFromStorage(): void {
    try {
      const storedCart = localStorage.getItem(this.CART_STORAGE_KEY);
      if (storedCart) {
        const cartItems: CartItem[] = JSON.parse(storedCart);
        console.log('🛒 Loading cart from localStorage:', cartItems);
        this.cartItemsSubject.next(cartItems);
      }
    } catch (error) {
      console.error('❌ Error loading cart from localStorage:', error);
      this.cartItemsSubject.next([]);
    }
  }

  // Save cart to localStorage
  private saveCartToStorage(): void {
    try {
      const cartItems = this.cartItemsSubject.value;
      console.log('💾 Saving cart to localStorage:', cartItems);
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('❌ Error saving cart to localStorage:', error);
    }
  }

  // Update cart and save to storage
  private updateCart(items: CartItem[]): void {
    this.cartItemsSubject.next(items);
    this.saveCartToStorage();
  }
}
