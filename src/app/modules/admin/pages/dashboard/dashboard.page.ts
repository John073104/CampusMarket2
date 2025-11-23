import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class DashboardPage implements OnInit {
  userName = '';
  userEmail = '';
  pendingApplicationsCount = 0;
  pendingProductsCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private userService: UserService,
    private productService: ProductService
  ) { }

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || user.email.split('@')[0];
      this.userEmail = user.email;
      await this.loadNotifications();
    }
  }

  async loadNotifications() {
    try {
      // Load pending seller applications count
      const applications = await this.userService.getPendingApplications();
      this.pendingApplicationsCount = applications.length;

      // Load pending products count
      const products = await this.productService.getPendingProducts();
      this.pendingProductsCount = products.length;
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  goToUsers() {
    this.router.navigate(['/admin/users']);
  }

  goToSellerApplications() {
    this.router.navigate(['/admin/seller-applications']);
  }

  goToPendingProducts() {
    this.router.navigate(['/admin/pending-products']);
  }

  goToOrders() {
    this.router.navigate(['/admin/orders']);
  }

  goToAnalytics() {
    this.router.navigate(['/admin/analytics']);
  }

  goToUsersMap() {
    this.router.navigate(['/admin/users-map']);
  }

  goToMessages() {
    this.router.navigate(['/admin/messages']);
  }

  goToProfile() {
    this.router.navigate(['/admin/profile']);
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

