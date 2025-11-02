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

