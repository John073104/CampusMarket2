import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { SellerApplication } from '../../../../models/user.model';

@Component({
  selector: 'app-seller-applications',
  templateUrl: './seller-applications.page.html',
  styleUrls: ['./seller-applications.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SellerApplicationsPage implements OnInit {
  applications: SellerApplication[] = [];
  loading: boolean = false;
  selectedStatus: string = 'pending';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadApplications();
  }

  async loadApplications() {
    this.loading = true;
    try {
      this.applications = await this.userService.getSellerApplications(this.selectedStatus as any);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      this.loading = false;
    }
  }

  async approveApplication(applicationId: string, userId: string) {
    const alert = await this.alertController.create({
      header: 'Approve Application',
      message: 'Are you sure you want to approve this seller application? The user will be granted seller privileges.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Approve',
          role: 'confirm',
          handler: async () => {
            try {
              const admin = this.authService.getCurrentUser();
              if (!admin) return;
              
              await this.userService.approveSellerApplication(applicationId, userId, admin.userId!);
              await this.loadApplications();
              
              const toast = await this.toastController.create({
                message: 'Seller application approved successfully!',
                duration: 2000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('Error approving application:', error);
              const toast = await this.toastController.create({
                message: 'Failed to approve application. Please try again.',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async rejectApplication(applicationId: string) {
    const alert = await this.alertController.create({
      header: 'Reject Application',
      message: 'Are you sure you want to reject this seller application?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reject',
          role: 'confirm',
          handler: async () => {
            try {
              const admin = this.authService.getCurrentUser();
              if (!admin) return;
              
              await this.userService.rejectSellerApplication(applicationId, admin.userId!);
              await this.loadApplications();
              
              const toast = await this.toastController.create({
                message: 'Application rejected.',
                duration: 2000,
                color: 'warning',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('Error rejecting application:', error);
              const toast = await this.toastController.create({
                message: 'Failed to reject application. Please try again.',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  formatDate(timestamp: any): string {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  }
}

