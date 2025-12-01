import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../../../services/cart.service';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { ProductService } from '../../../../services/product.service';
import { UserService } from '../../../../services/user.service';
import { EmailService } from '../../../../services/email.service';

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
    meetupLocation: '',
    shippingLocation: 'CTE Building' as string,
    shippingFee: 20,
    paymentMethod: 'cod' as 'cod' | 'gcash' | 'bank_transfer' | 'meet_and_pay',
    paymentProofImage: ''
  };
  
  // Campus locations with shipping fees
  campusLocations = [
    { name: 'CTE Building', fee: 20 },
    { name: 'Main Building', fee: 20 },
    { name: 'Library', fee: 15 },
    { name: 'Gymnasium', fee: 25 },
    { name: 'Cafeteria', fee: 15 },
    { name: 'Science Laboratory', fee: 30 },
    { name: 'Engineering Building', fee: 25 },
    { name: 'Dorm Area', fee: 35 },
    { name: 'Sports Complex', fee: 40 },
    { name: 'Admin Office', fee: 20 }
  ];

  showPaymentProofUpload: boolean = false;
  uploadingProof: boolean = false;
  sellerPaymentDetails: any = null;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private productService: ProductService,
    private userService: UserService,
    private emailService: EmailService,
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
  
  onLocationChange() {
    const location = this.campusLocations.find(loc => loc.name === this.checkoutData.shippingLocation);
    if (location) {
      this.checkoutData.shippingFee = location.fee;
    }
  }
  
  getTotalWithShipping(): number {
    const cartTotal = this.getTotal();
    return this.checkoutData.paymentMethod === 'cod' ? 
      cartTotal + this.checkoutData.shippingFee : cartTotal;
  }

  async checkout() {
    if (this.cartItems.length === 0) return;
    
    // Validate payment method requirements
    if (this.checkoutData.paymentMethod === 'meet_and_pay' && !this.checkoutData.meetupLocation) {
      const toast = await this.toastController.create({
        message: 'Please enter meetup location',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    if ((this.checkoutData.paymentMethod === 'gcash' || this.checkoutData.paymentMethod === 'bank_transfer') && 
        !this.checkoutData.paymentProofImage) {
      const toast = await this.toastController.create({
        message: 'Please upload payment proof',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }
    
    // Show checkout form
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
          placeholder: this.checkoutData.paymentMethod === 'meet_and_pay' ? 'Your Address (Optional)' : 'Delivery Address',
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
            if (!data.name || !data.phone) {
              const toast = await this.toastController.create({
                message: 'Please fill in name and phone number',
                duration: 2000,
                color: 'warning',
                position: 'top'
              });
              await toast.present();
              return false;
            }
            
            if (this.checkoutData.paymentMethod !== 'meet_and_pay' && !data.address) {
              const toast = await this.toastController.create({
                message: 'Please fill in delivery address',
                duration: 2000,
                color: 'warning',
                position: 'top'
              });
              await toast.present();
              return false;
            }
            
            this.checkoutData.name = data.name;
            this.checkoutData.phone = data.phone;
            this.checkoutData.address = data.address;
            
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
        
        const totalWithShipping = this.checkoutData.paymentMethod === 'cod' ? 
          total + this.checkoutData.shippingFee : total;
        
        const orderId = await this.orderService.createOrder(
          user.userId!,
          user.name || user.email,
          sellerId,
          items[0].sellerName,
          orderItems,
          totalWithShipping,
          this.checkoutData,
          this.checkoutData.paymentMethod,
          this.checkoutData.paymentProofImage,
          `Payment: ${this.checkoutData.paymentMethod}${this.checkoutData.paymentMethod === 'cod' ? ' | Location: ' + this.checkoutData.shippingLocation + ' | Shipping: ₱' + this.checkoutData.shippingFee : ''}`
        );
        
        console.log('Order created successfully:', orderId);
      }

      // Send email receipt
      try {
        const emailSent = await this.emailService.sendOrderReceipt({
          customerEmail: user.email,
          customerName: user.name || user.email,
          orderId: Array.from(itemsBySeller.keys())[0], // First order ID
          items: this.cartItems.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: this.getTotal(),
          orderDate: new Date().toLocaleDateString(),
          paymentMethod: this.checkoutData.paymentMethod,
          deliveryAddress: this.checkoutData.paymentMethod === 'meet_and_pay' 
            ? this.checkoutData.meetupLocation 
            : this.checkoutData.address
        });
        
        if (emailSent) {
          console.log('Order receipt email sent successfully');
        }
      } catch (emailError) {
        console.error('Failed to send email receipt:', emailError);
        // Don't block order completion if email fails
      }

      // Clear cart
      await this.cartService.clearCart();
      
      // Show success message
      const toast = await this.toastController.create({
        message: '🎉 Order placed successfully! Check your email for receipt. Track order in "My Orders"',
        duration: 4000,
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

  async onPaymentMethodChange() {
    this.showPaymentProofUpload = this.checkoutData.paymentMethod === 'gcash' || this.checkoutData.paymentMethod === 'bank_transfer';
    
    if (this.showPaymentProofUpload && this.cartItems.length > 0) {
      // Get seller payment details
      const sellerId = this.cartItems[0].sellerId;
      const seller = await this.userService.getUserById(sellerId);
      if (seller) {
        this.sellerPaymentDetails = {
          gcashNumber: seller.gcashNumber,
          gcashName: seller.gcashName,
          bankAccount: seller.bankAccount,
          bankName: seller.bankName,
          bankAccountName: seller.bankAccountName
        };
      }
    }
  }

  async onPaymentProofSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const toast = await this.toastController.create({
        message: 'Please select an image file',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const toast = await this.toastController.create({
        message: 'Image size must be less than 5MB',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.uploadingProof = true;
    try {
      // Convert to base64
      const base64 = await this.fileToBase64(file);
      this.checkoutData.paymentProofImage = base64;
      
      const toast = await this.toastController.create({
        message: 'Payment proof uploaded successfully',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      const toast = await this.toastController.create({
        message: 'Failed to upload image. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.uploadingProof = false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  removePaymentProof() {
    this.checkoutData.paymentProofImage = '';
  }
}

