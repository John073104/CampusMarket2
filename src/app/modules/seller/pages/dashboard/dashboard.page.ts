import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { OrderService } from '../../../../services/order.service';
import { ChatService } from '../../../../services/chat.service';
import { ProductService } from '../../../../services/product.service';

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
  newOrdersCount = 0;
  unreadMessagesCount = 0;
  lowStockCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private orderService: OrderService,
    private chatService: ChatService,
    private productService: ProductService
  ) { }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || user.email.split('@')[0];
      this.userEmail = user.email;
      await this.loadNotifications(user.userId);
    }
  }

  ionViewWillEnter() {
    const user = this.authService.getCurrentUser();
    if (user && user.userId) {
      this.loadNotifications(user.userId);
    }
  }

  async loadNotifications(userId: string) {
    try {
      // Load new orders count (placed/confirmed status)
      const orders = await this.orderService.getOrdersBySeller(userId);
      this.newOrdersCount = orders.filter(o => 
        ['placed', 'confirmed'].includes(o.status)
      ).length;

      // Load unread messages count
      this.unreadMessagesCount = await this.chatService.getTotalUnreadCount(userId);

      // Load low stock products (quantity <= 5)
      const products = await this.productService.getProductsBySeller(userId);
      this.lowStockCount = products.filter((p: any) => p.stock <= 5 && p.stock > 0).length;
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  goToAddProduct() {
    this.router.navigate(['/seller/add-product']);
  }

  goToProducts() {
    this.router.navigate(['/seller/products']);
  }

  goToOrders() {
    this.router.navigate(['/seller/orders']);
  }

  goToChats() {
    this.router.navigate(['/seller/chats']);
  }

  goToAnalytics() {
    this.router.navigate(['/seller/analytics']);
  }

  goToProfile() {
    this.router.navigate(['/seller/profile']);
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

