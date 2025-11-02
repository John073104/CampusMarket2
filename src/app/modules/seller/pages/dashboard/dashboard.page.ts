import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

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

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || user.email.split('@')[0];
      this.userEmail = user.email;
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

