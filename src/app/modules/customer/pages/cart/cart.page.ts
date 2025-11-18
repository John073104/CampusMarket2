import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../../../services/cart.service';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { ProductService } from '../../../../services/product.service';

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
  
  // Checkout form data
  checkoutData = {
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash_on_delivery'
  };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadCart();
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadCart();
  }

  async loadCart() {
    this.cartItems = this.cartService.getCartItems();
  }

  loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.checkoutData.name = user.name || '';
      this.checkoutData.phone = user.phone || '';
    }
  }

  async updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      // Check if new quantity exceeds stock
      try {
        const product = await this.productService.getProductById(item.productId);
        if (product && newQuantity > product.stock) {
          const toast = await this.toastController.create({
            message: `Only ${product.stock} items available in stock`,
            duration: 2000,
            color: 'warning',
            position: 'top'
          });
          await toast.present();
          return;
        }
      } catch (error) {
        console.error('Error checking stock:', error);
      }
      
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
    
    // Show checkout form first
    const alert = await this.alertController.create({
      header: 'Checkout Information',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Full Name',
          value: this.checkoutData.name
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Phone Number',
          value: this.checkoutData.phone
        },
        {
          name: 'address',
          type: 'textarea',
          placeholder: 'Delivery Address',
          value: this.checkoutData.address
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Place Order',
          handler: async (data) => {
            if (!data.name || !data.phone || !data.address) {
              const toast = await this.toastController.create({
                message: 'Please fill in all required fields',
                duration: 2000,
                color: 'warning',
                position: 'top'
              });
              await toast.present();
              return false;
            }
            
            this.checkoutData = {
              ...data,
              paymentMethod: 'cash_on_delivery'
            };
            
            await this.processCheckout();
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async processCheckout() {
    this.loading = true;
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Validate stock for all items
      for (const item of this.cartItems) {
        const product = await this.productService.getProductById(item.productId);
        if (!product) {
          const toast = await this.toastController.create({
            message: `Product "${item.productName}" no longer available`,
            duration: 3000,
            color: 'danger',
            position: 'top'
          });
          await toast.present();
          await this.removeItem(item.productId);
          this.loading = false;
          return;
        }
        
        if (item.quantity > product.stock) {
          const toast = await this.toastController.create({
            message: `Only ${product.stock} of "${item.productName}" available`,
            duration: 3000,
            color: 'warning',
            position: 'top'
          });
          await toast.present();
          this.loading = false;
          return;
        }
      }

      // Group items by seller
      const itemsBySeller = this.cartService.getCartItemsBySeller();
      
      // Create an order for each seller
      console.log('Creating orders for sellers...', itemsBySeller.size);
      for (const [sellerId, items] of itemsBySeller) {
        const orderItems: any[] = items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          productImage: item.productImage
        }));
        
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        console.log('Creating order:', {
          customerId: user.userId,
          sellerId,
          total,
          itemCount: orderItems.length,
          deliveryInfo: this.checkoutData
        });
        
        const orderId = await this.orderService.createOrder(
          user.userId!,
          user.name || user.email,
          sellerId,
          items[0].sellerName,
          orderItems,
          total,
          this.checkoutData,
          undefined,
          `Payment: ${this.checkoutData.paymentMethod}`
        );
        
        console.log('Order created successfully:', orderId);
      }

      // Clear cart
      await this.cartService.clearCart();
      
      // Show success message
      const toast = await this.toastController.create({
        message: '🎉 Order placed successfully! Track it in "My Orders"',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      // Navigate to orders
      setTimeout(() => {
        this.router.navigate(['/customer/orders']);
      }, 1000);
    } catch (error: any) {
      console.error('Error during checkout:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      const toast = await this.toastController.create({
        message: `Failed to place order: ${error?.message || 'Please check your internet connection and try again.'}`,
        duration: 5000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  continueShopping() {
    this.router.navigate(['/customer/products']);
  }
}

