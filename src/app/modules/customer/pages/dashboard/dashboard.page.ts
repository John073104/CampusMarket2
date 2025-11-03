import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { CartService } from '../../../../services/cart.service';
import { ChatService } from '../../../../services/chat.service';
import { OrderService } from '../../../../services/order.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DashboardPage implements OnInit {
  userName = '';
  userEmail = '';
  
  // Notification badges
  cartCount = 0;
  unreadMessagesCount = 0;
  pendingOrdersCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private cartService: CartService,
    private chatService: ChatService,
    private orderService: OrderService
  ) { }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || user.email.split('@')[0];
      this.userEmail = user.email;
      await this.loadNotifications(user.userId!);
    }
  }

  async loadNotifications(userId: string) {
    try {
      // Load cart count
      const cartItems = this.cartService.getCartItems();
      this.cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      // Load unread messages count
      this.unreadMessagesCount = await this.chatService.getTotalUnreadCount(userId);

      // Load pending orders count
      const orders = await this.orderService.getOrdersByCustomer(userId);
      this.pendingOrdersCount = orders.filter(o => 
        ['placed', 'confirmed', 'ready_for_pickup'].includes(o.status)
      ).length;
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  goToProducts() {
    this.router.navigate(['/customer/products']);
  }

  goToCart() {
    this.router.navigate(['/customer/cart']);
  }

  goToOrders() {
    this.router.navigate(['/customer/orders']);
  }

  goToChats() {
    this.router.navigate(['/customer/chats']);
  }

  goToProfile() {
    this.router.navigate(['/customer/profile']);
  }

  goToApplySeller() {
    this.router.navigate(['/customer/apply-seller']);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Sign Out',
          role: 'confirm',
          handler: async () => {
            await this.authService.signOut();
            this.router.navigate(['/landing']);
          }
        }
      ]
    });

    await alert.present();
  }
}

