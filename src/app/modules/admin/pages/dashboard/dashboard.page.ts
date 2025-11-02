import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

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

