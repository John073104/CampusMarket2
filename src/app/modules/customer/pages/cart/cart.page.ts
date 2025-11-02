import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../../../services/cart.service';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CartPage implements OnInit {
  cartItems: CartItem[] = [];
  loading: boolean = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCart();
  }

  ionViewWillEnter() {
    this.loadCart();
  }

  async loadCart() {
    this.cartItems = this.cartService.getCartItems();
  }

  async updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      await this.cartService.updateQuantity(item.productId, newQuantity);
      this.loadCart();
    }
  }

  async removeItem(productId: string) {
    await this.cartService.removeFromCart(productId);
    this.loadCart();
  }

  getTotal(): number {
    return this.cartService.getCartTotal();
  }

  getItemCount(): number {
    return this.cartService.getCartCount();
  }

  async checkout() {
    if (this.cartItems.length === 0) return;
    
    this.loading = true;
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Group items by seller
      const itemsBySeller = this.cartService.getCartItemsBySeller();
      
      // Create an order for each seller
      for (const [sellerId, items] of itemsBySeller) {
        const orderItems: any[] = items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          productImage: item.productImage
        }));
        
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await this.orderService.createOrder(
          user.userId!,
          user.name || user.email,
          sellerId,
          items[0].sellerName,
          orderItems,
          total
        );
      }

      // Clear cart
      await this.cartService.clearCart();
      
      // Navigate to orders
      this.router.navigate(['/customer/orders']);
    } catch (error) {
      console.error('Error during checkout:', error);
    } finally {
      this.loading = false;
    }
  }

  continueShopping() {
    this.router.navigate(['/customer/products']);
  }
}

