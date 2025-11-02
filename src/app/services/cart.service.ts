import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$: Observable<CartItem[]> = this.cartSubject.asObservable();
  private storageInitialized = false;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    await this.storage.create();
    this.storageInitialized = true;
    await this.loadCart();
  }

  private async loadCart() {
    if (!this.storageInitialized) {
      await this.init();
    }
    const cart = await this.storage.get('cart');
    this.cartItems = cart || [];
    this.cartSubject.next(this.cartItems);
  }

  private async saveCart() {
    if (!this.storageInitialized) {
      await this.init();
    }
    await this.storage.set('cart', this.cartItems);
    this.cartSubject.next(this.cartItems);
  }

  async addToCart(item: CartItem): Promise<void> {
    const existingItem = this.cartItems.find(
      i => i.productId === item.productId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItems.push(item);
    }

    await this.saveCart();
  }

  async removeFromCart(productId: string): Promise<void> {
    this.cartItems = this.cartItems.filter(
      item => item.productId !== productId
    );
    await this.saveCart();
  }

  async updateQuantity(productId: string, quantity: number): Promise<void> {
    const item = this.cartItems.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        await this.removeFromCart(productId);
      } else {
        await this.saveCart();
      }
    }
  }

  async clearCart(): Promise<void> {
    this.cartItems = [];
    await this.saveCart();
  }

  getCartItems(): CartItem[] {
    return this.cartItems;
  }

  getCartTotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
  }

  getCartCount(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.quantity, 
      0
    );
  }

  // Group cart items by seller
  getCartItemsBySeller(): Map<string, CartItem[]> {
    const itemsBySeller = new Map<string, CartItem[]>();
    
    this.cartItems.forEach(item => {
      if (!itemsBySeller.has(item.sellerId)) {
        itemsBySeller.set(item.sellerId, []);
      }
      itemsBySeller.get(item.sellerId)!.push(item);
    });

    return itemsBySeller;
  }
}
